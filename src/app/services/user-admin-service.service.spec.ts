import { TestBed } from '@angular/core/testing';

import { UserAdminServiceService } from './user-admin-service.service';

describe('UserAdminServiceService', () => {
  let service: UserAdminServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UserAdminServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
