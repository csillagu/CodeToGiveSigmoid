import { Component, OnInit } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Config, ConfigService} from "../config/config.service";
import {Subscription} from "rxjs";

@Component({
  selector: 'app-test-table',
  templateUrl: './test-table.component.html',
  styleUrls: ['./test-table.component.css']
})

export class TestTableComponent implements OnInit {
  matrix:Array<Array<Number>> =[[0, 0, 0, 0,0 ], [2, 0, 2, 3,5], [3, 0, 2, 3,5], [4, 0, 2, 3,5]]
  matrix_loaded:Boolean =false
  offlineUrl = 'assets/matrix.json';
  onClick(){
    let res=this.http.get<Config>('https://fce2672e-71fe-4350-a614-e46da6dd5f7f.mock.pstmn.io/test1',
      { responseType: 'json',headers:{ ["w"]:"12", ["h"]: "55", ["num"]:"7"}})
      .subscribe( (data : Config) => {
        this.matrix = data.matrix
        this.matrix_loaded = true
      })
    console.log(this.matrix)
  }
  constructor(private http : HttpClient) {
  }

  ngOnInit(): void {

  }

}
