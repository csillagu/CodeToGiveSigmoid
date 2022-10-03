import {Component, Injectable, OnInit} from '@angular/core';
import {TestTableComponent} from "../test-table/test-table.component";
import {MenuService} from "../comm/MenuService";

@Component({
  selector: 'app-left-menu',
  templateUrl: './left-menu.component.html',
  styleUrls: ['./left-menu.component.css'],
})

export class LeftMenuComponent implements OnInit {
  constructor(public menuservice:MenuService) {
  }

  ngOnInit(): void {
  }

}
