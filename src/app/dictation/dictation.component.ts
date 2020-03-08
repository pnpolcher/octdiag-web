import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { LoginService } from '../services/login.service';
import { TranscribeMedicalService } from '../services/transcribe-medical.service';
import { Transcript } from '../model/transcript';
import { Validators, FormControl, FormGroup } from '@angular/forms';

import { DiagnoseService } from '../services/diagnose.service';
import { DataSource } from '@angular/cdk/table';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { Diagnosis } from '../model/diagnosis';
import { catchError, finalize } from 'rxjs/operators';
import { DiagnoseResponse } from '../model/diagnose-response';

@Component({
  selector: 'app-dictation',
  templateUrl: './dictation.component.html',
  styleUrls: ['./dictation.component.css']
})
export class DictationComponent implements OnInit {

  loading = false;
  sessionToken: string;
  startStopCaption = 'Start';
  recording = false;
  mediaStream: MediaStream = null;

  notesForm = new FormGroup({
    notes: new FormControl('', [
      Validators.required
    ])
  });

  transcriptText: string;

  dataSource = new DiagnosesDataSource(this.diagnoseService, this);
  displayedColumns = [
    'name',
    'count',
    'frequency'
  ];

  constructor(private diagnoseService: DiagnoseService, private loginService: LoginService,
              private transcribeService: TranscribeMedicalService) { }

  ngOnInit(): void {
    this.sessionToken = this.loginService.sessionToken;
  }

  private onTranscript(controller: any, transcript: Transcript): void {

    let value: string;
    if (transcript.isPartial) {
      value = controller.transcriptText + transcript.text;
    } else {
      controller.transcriptText = controller.transcriptText + transcript.text;
      value = controller.transcriptText;
    }
    controller.notesForm.get('notes').setValue(value);
  }

  private onError(err: any): void {
  }

  onStartStopRecording() {
    if (!this.recording) {
      console.log('Starting audio recording.');
      this.transcriptText = '';
      this.notesForm.get('notes').setValue('');
      this.startStopCaption = 'Stop';
      navigator.mediaDevices.getUserMedia({audio: true, video: false}).then(mediaStream => {
        this.mediaStream = mediaStream;
        this.transcribeService.startTranscription(mediaStream, (transcript) => this.onTranscript(this, transcript), this.onError);
      });
    } else {
      console.log('Stopping audio recording.');
      this.startStopCaption = 'Start';
      this.transcribeService.stopTranscription();
      this.mediaStream.getAudioTracks().forEach(x => {
        x.stop();
      });
    }
    this.recording = !this.recording;
  }

  onStartDiagnosis() {
    this.dataSource.diagnose(this.notesForm.get('notes').value);
  }
}

class DiagnosesDataSource extends DataSource<any> {

  private diagnosesSubject = new BehaviorSubject<Diagnosis[]>([]);

  constructor(private diagnoseService: DiagnoseService, private controller: DictationComponent) {
    super();
  }

  connect(): Observable<Diagnosis[]> {
    return this.diagnosesSubject.asObservable();
  }

  disconnect() {
    this.diagnosesSubject.complete();
  }

  diagnose(notes: string) {
    this.controller.loading = true;
    return this.diagnoseService.diagnose(notes).pipe(
      catchError(() => of([])),
      finalize(() => this.controller.loading = false))
      .subscribe((diagnoseResponse: DiagnoseResponse) => {
        this.diagnosesSubject.next(diagnoseResponse.diagnoses);
      }
    );
  }
}
