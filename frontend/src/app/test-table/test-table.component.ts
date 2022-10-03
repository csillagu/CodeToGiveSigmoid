import {Component, Injectable, OnDestroy, OnInit} from '@angular/core';
import {HttpClient, HttpResponse} from "@angular/common/http";
import {Config} from "../config/config.service";
import {isEmpty, Observable, range, Subscription} from "rxjs";
import { timer } from "rxjs";
import {MenuService} from "../comm/MenuService";

@Component({
  selector: 'app-test-table',
  templateUrl: './test-table.component.html',
  styleUrls: ['./test-table.component.css'],
})

export class TestTableComponent implements OnDestroy {
  matrix:Array<Array<number>> =[]
  results:Array<Array<number>> =[]
  results_row:Array<number>=[]
  matrix_loaded:boolean =false
  test_finished=false
  timerDisplay=""
  time=0
  description="IDE JÖN A LEÍRÁS"
  offlineUrl = 'assets/matrix.json';
  timer: Subscription | undefined
  http_sub: Array<Subscription>=[]
  uid=window.location.href.split('/')[window.location.href.split('/').length-1]
  errorText: string | null | undefined
  onLoadClick(){
    try {
      this.http_sub?.push(this.http.get<Config>('http://127.0.0.1:8000/chairlamp/5b095202389947e51b1cc651c5106ace',
        {responseType: 'json', observe: "response", headers: {}})
        .subscribe(data => this.processGetResponse(data),
        error=>{this.errorText=error}))
    }
    catch (e) {
            this.errorText="HOGY KELL EXCEPTIONBOL STRINGET KISZEDNI????"
    }
  }

  private processGetResponse(data: HttpResponse<Config>) {
    if ((+data.status) == 200) {
      this.matrix = data.body!.matrix
      this.matrix_loaded = true
      this.startTimer()
    } else {
      this.errorText = data.statusText
    }
  }

  submit(){
    this.results.push(this.results_row)
    console.log("ITT EZ A SZAR")
    console.log(this.results)
    this.timer?.unsubscribe()
    try {
      this.http_sub?.push(this.http.post<string>('http://127.0.0.1:8000/chairlamp/5b095202389947e51b1cc651c5106ace',
        {circled: this.results, finished: this.time}, {observe: "response"}).subscribe(
        (data) => this.processPostResponse(data),
        error=>{this.errorText=error}))
    }catch (e){
      this.matrix_loaded=false

      this.errorText="HOGY KELL EXCEPTIONBOL STRINGET KISZEDNI????"
    }
  }

  private processPostResponse(data: HttpResponse<string>) {
    console.log(data.status)
    this.matrix_loaded = false
    if (data.status == 200) {
      this.test_finished = true
      console.log(this.results)
    } else if (data.status == 400) {
      this.errorText = "User not in db (will be sent from server later)"
    } else {
      this.errorText = data.statusText
    }
  }

  onImageClick(col:number, row:number){
    //elmenti, hogy be van karikázva:
    let row_length=this.matrix[0].length
    if(this.results_row.length==0 || row_length*row+col>this.results_row[this.results_row.length-1]){
      this.results_row.push(row_length*row+col)
      //konkreét karika:
      this.matrix[row][col]+=100
      console.log(this.results)
    }
  }
  constructor(private http : HttpClient, private menu:MenuService) {
    menu.uid=this.uid
  }

  ngOnDestroy(): void {
    console.log("OnDestroy")
    for (let httpSubElement of this.http_sub) {
      httpSubElement.unsubscribe()
    }
    this.timer?.unsubscribe()
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
      this.menu.timeRunning=this.matrix_loaded
      this.menu.timeDisplay=this.timerDisplay
      if(this.time==30){
        this.submit()
      }
      if(this.time%10==0){
        this.results.push([...this.results_row])
      }
    });
  }
  ngOnInit() {

  }

}
