import { Component, OnInit } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Config, ConfigService} from "../config/config.service";
import {range, Subscription} from "rxjs";

@Component({
  selector: 'app-test-table',
  templateUrl: './test-table.component.html',
  styleUrls: ['./test-table.component.css']
})

export class TestTableComponent implements OnInit {
  matrix:Array<Array<Number>> =[[ 0,0 ], [ 3,5], [ 3,5], [ 3,5]]
  matrix_zeros:Array<Array<Number>> =[[0]]
  matrix_loaded:Boolean =false
  w=12
  offlineUrl = 'assets/matrix.json';
  onClick(){
    let res=this.http.get<Config>('https://fce2672e-71fe-4350-a614-e46da6dd5f7f.mock.pstmn.io/test1',
      { responseType: 'json',headers:{ ["w"]:"12", ["h"]: "55", ["num"]:"7"}})
      .subscribe( (data : Config) => {
        this.matrix = data.matrix
        this.matrix_zeros = data.matrix.map(x =>  x.map(a=>a));
        console.log(this.matrix_zeros)
        this.matrix_loaded = true
        this.matrix_zeros.forEach(
          (item, index) =>{
            this.matrix_zeros[index].fill(0)
          }
        )
        console.log(this.matrix_zeros)
      })
  }

  onImageClick(col:number, row:number){
    this.matrix_zeros[row][col]=1
    this.matrix[row][col]=1

    console.log(this.matrix_zeros)
  }
  constructor(private http : HttpClient) {
  }

  ngOnInit(): void {

  }

}
