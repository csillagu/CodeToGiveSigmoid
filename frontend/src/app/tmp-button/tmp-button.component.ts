import { Component, OnInit } from '@angular/core';
import {HttpClient, HttpClientModule} from "@angular/common/http";

@Component({
  selector: 'app-tmp-button',
  templateUrl: './tmp-button.component.html',
  styleUrls: ['./tmp-button.component.css']
})
export class TmpButtonComponent implements OnInit {

  http : HttpClient

  constructor(http:HttpClient ) {
    this.http = http
  }

  ngOnInit(): void {
  }
  sendMsg():void {
    let res = this.http.get('http://127.0.0.1:8000/').subscribe(data => console.log(data))
  }


}
