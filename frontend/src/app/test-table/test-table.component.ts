import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-test-table',
  templateUrl: './test-table.component.html',
  styleUrls: ['./test-table.component.css']
})
export class TestTableComponent implements OnInit {
  matrix =[[1, 0, 2, 3,5], [2, 0, 2, 3,5], [3, 0, 2, 3,5], [4, 0, 2, 3,5]]
  constructor() { }

  ngOnInit(): void {

  }

}
