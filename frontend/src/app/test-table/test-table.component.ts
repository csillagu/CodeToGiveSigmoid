import {Component, OnDestroy, OnInit} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Config, ConfigService} from "../config/config.service";
import {Observable, range, Subscription} from "rxjs";
import {TmpButtonComponent} from "../tmp-button/tmp-button.component";
import { timer } from "rxjs";

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
  timerDisplay=""
  time=0
  offlineUrl = 'assets/matrix.json';
  timer: Subscription | undefined

  onLoadClick(){

      let res=this.http.get<Config>('http://127.0.0.1:8000/chairlamp/bfe07c76562eb1fccb970ed3b30800d5',
      { responseType: 'json',headers:{}}).subscribe( (data : Config) => {
        this.matrix = data.matrix
        console.log(this.matrix)
        this.matrix_zeros = data.matrix.map(x =>  x.map(a=>a))
        this.matrix_given = data.matrix.map(x =>  x.map(a=>a));
        this.matrix_loaded = true
        this.matrix_zeros.forEach(
          (item, index) =>{
            this.matrix_zeros[index].fill(0)
          }
        )
        this.startTimer()

      })
    //res.unsubscribe()
  }
  submit(){
    this.timer?.unsubscribe()
    this.matrix_zeros=[[0,2,4,9,10], [11,21,23], [40,43,51]]
    this.http.post<string>('http://127.0.0.1:8000/chairlamp/bfe07c76562eb1fccb970ed3b30800d5',
      {circled: this.matrix_zeros}).subscribe((data)=>{
      console.log(data)
      this.matrix_loaded=false
    })
  }
  onImageClick(col:number, row:number){
    //elmenti, hogy be van karikázva:
    this.matrix_zeros[row][col]=1
    //konkreét karika:
    this.matrix[row][col]=1

    console.log(this.matrix_zeros)
  }
  constructor(private http : HttpClient) {

  }

  getDisplayTimer(time: number) {
    const minutes = ''+Math.floor(time % 3600 / 60);
    const seconds = '0' + Math.floor(time % 3600 % 60);

    return minutes.slice(-2, -1 ) + minutes.slice(-1) +":"+
      seconds.slice(-2, -1 ) + seconds.slice(-1)

  }
  startTimer(){
    this.timer=timer(0, 1000).subscribe(ec => {
      this.time++;
      this.timerDisplay= this.getDisplayTimer(this.time);
      if(this.time==30){

        this.submit()
      }
    });
  }
  ngOnInit() {

  }

}
