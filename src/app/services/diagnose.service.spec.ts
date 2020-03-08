import { TestBed } from '@angular/core/testing';

import { DiagnoseService } from './diagnose.service';

describe('DiagnoseService', () => {
  let service: DiagnoseService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DiagnoseService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
