import { Component, OnInit } from '@angular/core';
import { LoginService } from '../services/login.service';
import { TranscribeMedicalService } from '../services/transcribe-medical.service';
import { Transcript } from '../model/transcript';

@Component({
  selector: 'app-dictation',
  templateUrl: './dictation.component.html',
  styleUrls: ['./dictation.component.css']
})
export class DictationComponent implements OnInit {

  sessionToken: string;
  startStopCaption = 'Start';
  recording = false;
  mediaStream: MediaStream = null;

  constructor(private loginService: LoginService, private transcribeService: TranscribeMedicalService) { }

  ngOnInit(): void {
    this.sessionToken = this.loginService.sessionToken;
  }

  private onTranscript(transcript: Transcript): void {
    console.log(transcript.text);
  }

  private onError(err: any): void {
  }

  onStartStopRecording() {
    if (!this.recording) {
      this.startStopCaption = 'Stop';
      navigator.mediaDevices.getUserMedia({audio: true, video: false}).then(mediaStream => {
        this.mediaStream = mediaStream;
        this.transcribeService.startTranscription(mediaStream, this.onTranscript, this.onError);
      });
    } else {
      this.startStopCaption = 'Start';
      this.transcribeService.stopTranscription();
      this.mediaStream.getAudioTracks().forEach(x => {
        x.stop();
      });
    }
    this.recording = !this.recording;
  }

}
