import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TmpButtonComponent } from './tmp-button.component';

describe('TmpButtonComponent', () => {
  let component: TmpButtonComponent;
  let fixture: ComponentFixture<TmpButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TmpButtonComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TmpButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
