import { Injectable } from '@angular/core';

import { LoginService } from './login.service';
import { environment } from '../../environments/environment';

import { AwsSignatureV4, AwsSignatureV4Options } from '../aws/utils';

import * as crypto from 'crypto';
import * as MicrophoneStream from 'microphone-stream';
import * as marshaller from '@aws-sdk/eventstream-marshaller';
import * as util_utf8_node from '@aws-sdk/util-utf8-node';
import { Transcript } from '../model/transcript';

import * as audio from '../media/audio';
import { Message } from '@aws-sdk/eventstream-marshaller';

@Injectable({
  providedIn: 'root'
})
export class TranscribeMedicalService {

  private eventStreamMarshaller = new marshaller.EventStreamMarshaller(util_utf8_node.toUtf8, util_utf8_node.fromUtf8);

  private micStream: MicrophoneStream;

  private onTranscript: (Transcript) => void;

  private sampleRate = 16000;

  private socketError: boolean;

  private transcribeException: boolean;

  private transcribeSigner: AwsSignatureV4;

  private websocket: WebSocket;

  constructor(private loginService: LoginService) {
    const endpoint = `transcribestreaming.${environment.transcribeMedicalData.region}.amazonaws.com:8443`;
    this.transcribeSigner = new AwsSignatureV4(
      'GET',
      endpoint,
      '/medical-stream-transcription-websocket',
      environment.transcribeMedicalData.region,
      'transcribe');
    this.socketError = false;
  }

  private createPresignedUrl(): string {
    const options = new AwsSignatureV4Options();

    options.expires = 60;
    options.key = this.loginService.accessKeyId;
    options.protocol = 'wss';
    options.secret = this.loginService.secretAccessKey;
    options.sessionToken = this.loginService.sessionToken;
    options.query = 'language-code=en-US&media-encoding=pcm&sample-rate=16000&specialty=PRIMARYCARE&type=DICTATION';

    return this.transcribeSigner.createPresignedUrl(
      crypto.createHash('sha256').update('', 'utf8').digest('hex'), options);
  }

  private onWebSocketOpen() {
    this.micStream.on('data', rawAudioChunk => {
      const binary = this.convertAudioToBinaryMessage(rawAudioChunk);
      if (this.websocket.OPEN) {
        this.websocket.send(binary);
      }
    });
  }

  private onWebSocketMessage(message: MessageEvent) {
    const messageWrapper = this.eventStreamMarshaller.unmarshall(Buffer.from(message.data));
    const messageBody = JSON.parse(String.fromCharCode.apply(String, messageWrapper.body));

    if (messageWrapper.headers[':message-type'].value === 'event') {
      const results = messageBody.Transcript.Results;

      if (results.length > 0) {
        if (results[0].Alternatives.length > 0) {
          const transcript = new Transcript();
          transcript.results = results;
          transcript.text = decodeURIComponent(escape(results[0].Alternatives[0].Transcript));
          transcript.isPartial = results[0].IsPartial;
          this.onTranscript(transcript);
        }
      }
    } else {
      this.transcribeException = true;
      // showError(messageBody.Message);
  }
  }

  private onWebSocketError() {
    this.socketError = true;
    // showError('...');
  }

  private onWebSocketClose(closeEvent: CloseEvent) {
    this.micStream.stop();

    if (!this.socketError && !this.transcribeException) {
      if (closeEvent.code !== 1000) {
        // showError('Streaming exception ' + closeEvent.reason);
      }
    }
  }

  startTranscription(userMediaStream: MediaStream, onTranscript: (transcript: Transcript) => void, onError) {

    this.socketError = false;
    this.transcribeException = false;

    this.micStream = new MicrophoneStream();
    this.micStream.setStream(userMediaStream);

    const url = this.createPresignedUrl();

    try {
      // Assign the Transcribe Medical callbacks.
      this.onTranscript = onTranscript;

      // Open the websocket.
      this.websocket = new WebSocket(url);
      this.websocket.binaryType = 'arraybuffer';
      this.websocket.onopen = this.onWebSocketOpen;
      this.websocket.onmessage = this.onWebSocketMessage;
      this.websocket.onerror = this.onWebSocketError;
      this.websocket.onclose = this.onWebSocketClose;
    } catch (error) {
      console.log(error);
    }
  }

  stopTranscription() {
    this.closeSocket();
  }

  private closeSocket() {
    if (this.websocket.OPEN) {
      this.micStream.stop();

      const emptyMessage = this.getAudioEventMessage(Buffer.from([]));
      const emptyBuffer = this.eventStreamMarshaller.marshall(emptyMessage);
      this.websocket.send(emptyBuffer);
    }
  }

  private convertAudioToBinaryMessage(audioChunk): Uint8Array {
    const raw = MicrophoneStream.toRaw(audioChunk);

    if (raw == null) {
      return;
    }

    // Downsample and convet the raw audio bytes to PCM.
    const downsampledBuffer = audio.downsampleBuffer(raw, this.sampleRate);
    const pcmEncodedBuffer = audio.pcmEncode(downsampledBuffer);

    // Add the right JSON headers and structure to the message.
    const audioEventMessage = this.getAudioEventMessage(Buffer.from(pcmEncodedBuffer));

    // Convert the JSON object + headers into a binary event stream message.
    const binary = this.eventStreamMarshaller.marshall(audioEventMessage);

    return binary;
  }

  private getAudioEventMessage(buffer: Buffer): Message {
    const message = {} as Message;

    message.headers = {
      ':message-type': {
        type: 'string',
        value: 'event'
      },
      ':event-type': {
        type: 'string',
        value: 'AudioEvent'
      }
    };

    message.body = buffer;
    return message;
  }
}
