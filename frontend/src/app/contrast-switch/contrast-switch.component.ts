import {Component, Injectable, OnInit} from '@angular/core';

@Component({
  selector: 'contrast-switch',
  templateUrl: './contrast-switch.component.html',
  styleUrls: ['./contrast-switch.component.css'],
})
export class ContrastSwitchComponent implements OnInit {
  contrastOn = false;

  constructor() { }

  ngOnInit(): void {
  }

  contrastSwitch() {
    this.contrastOn = !this.contrastOn;

  }
}
