import {Component, OnDestroy, OnInit} from '@angular/core';
import {HttpClient, HttpResponse} from "@angular/common/http";
import {Config, ConfigService} from "../config/config.service";
import {Observable, range, Subscription} from "rxjs";
import { timer } from "rxjs";

@Component({
  selector: 'app-test-table',
  templateUrl: './test-table.component.html',
  styleUrls: ['./test-table.component.css']
})

export class TestTableComponent implements OnDestroy {
  matrix:Array<Array<Number>> =[]
  results:Array<Array<Number>> =[]
  results_row:Array<Number>=[-1]
  matrix_loaded:Boolean =false
  test_finished=false
  timerDisplay=""
  time=0
  descriprion="IDE JÖN A LEÍRÁS"
  offlineUrl = 'assets/matrix.json';
  timer: Subscription | undefined
  http_sub: Array<Subscription>=[]
  res_post: Subscription | undefined

  errorText: string | null | undefined
  onLoadClick(){
    try {
      this.http_sub?.push(this.http.get<Config>('http://127.0.0.1:8000/chairlamp/bfe07c76562eb1fccb970ed3b30800d5',
        {responseType: 'json', observe: "response", headers: {}}).subscribe(data =>
        this.processGetResponse(data)))
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
    this.timer?.unsubscribe()
    try {
      this.http_sub?.push(this.http.post<string>('http://127.0.0.1:8000/chairlamp/bfe07c76562eb1fccb970ed3b30800d5',
        {circled: this.results, finished_at: this.time}, {observe: "response"}).subscribe(
        (data) => this.processPostResponse(data)))
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
    if(row_length*row+col>this.results_row[this.results_row.length-1]){
      this.results_row.push(row_length*row+col)
      //konkreét karika:
      this.matrix[row][col]=1
      console.log(this.results)
    }
  }
  constructor(private http : HttpClient) {
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
