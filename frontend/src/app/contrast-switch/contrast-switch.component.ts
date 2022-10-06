import {Component, Injectable, OnInit} from '@angular/core';
import {ContrastMode} from "../comm/ContrastMode";
@Component({
  selector: 'contrast-switch',
  templateUrl: './contrast-switch.component.html',
  styleUrls: ['./contrast-switch.component.css'],
})
export class ContrastSwitchComponent implements OnInit {
  contrastOn = false;

  constructor(public contrastMode:ContrastMode) { }

  ngOnInit(): void {
  }

  contrastSwitch() {
    this.contrastMode.contrastOn = !this.contrastMode.contrastOn ;
    console.log("hello")

    if(this.contrastMode.contrastOn) {
      document.body.style.background = "black";
    } else {
      document.body.style.background = "white";
    }
  }
}
