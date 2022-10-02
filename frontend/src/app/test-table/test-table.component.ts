import { Component, OnInit } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Config, ConfigService} from "../config/config.service";
import {range, Subscription} from "rxjs";
import {TmpButtonComponent} from "../tmp-button/tmp-button.component";

@Component({
  selector: 'app-test-table',
  templateUrl: './test-table.component.html',
  styleUrls: ['./test-table.component.css']
})

export class TestTableComponent implements OnInit {
  matrix:Array<Array<Number>> =[[ 0,0 ], [ 3,5], [ 3,5], [ 3,5]]
  matrix_zeros:Array<Array<Number>> =[[0]]
  matrix_given:Array<Array<Number>> =[[0]]
  matrix_loaded:Boolean =false
  w=12
  h=8
  num=7
  offlineUrl = 'assets/matrix.json';
  onLoadClick(){
    let res=this.http.get<Config>('https://fce2672e-71fe-4350-a614-e46da6dd5f7f.mock.pstmn.io/test1',
      { responseType: 'json',headers:{["num"]:this.num.toString()}})
      .subscribe( (data : Config) => {
        this.matrix = data.matrix
        this.matrix_zeros = data.matrix.map(x =>  x.map(a=>a))
        this.matrix_given = data.matrix.map(x =>  x.map(a=>a));
        this.matrix_loaded = true
        this.matrix_zeros.forEach(
          (item, index) =>{
            this.matrix_zeros[index].fill(0)
          }
        )
      })
  }
  submit(){
    this.http.post<string>('https://ae3856c0-dba0-4dfd-b3e9-54de87080e82.mock.pstmn.io/test1_submit',
      {clicked: this.matrix_zeros}).subscribe((data)=>{
        console.log(data)
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
