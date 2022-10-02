import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestTableComponent } from './test-table.component';

describe('TestTableComponent', () => {
  let component: TestTableComponent;
  let fixture: ComponentFixture<TestTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TestTableComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TestTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
