import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminProduto } from './admin-produto';

describe('AdminProduto', () => {
  let component: AdminProduto;
  let fixture: ComponentFixture<AdminProduto>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminProduto]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminProduto);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
