import { TestBed } from '@angular/core/testing';

import { TranscribeMedicalService } from './transcribe-medical.service';

describe('TranscribeMedicalService', () => {
  let service: TranscribeMedicalService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TranscribeMedicalService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
