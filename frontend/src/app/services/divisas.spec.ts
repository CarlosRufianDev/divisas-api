import { TestBed } from '@angular/core/testing';

import { Divisas } from './divisas';

describe('Divisas', () => {
  let service: Divisas;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Divisas);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
