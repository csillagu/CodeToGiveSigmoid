import {Component,  OnDestroy} from '@angular/core';
import {HttpClient, HttpResponse} from "@angular/common/http";
import {Config, TestData} from "../config/config.service";
import {Subscription} from "rxjs";
import { timer } from "rxjs";
import {MenuService} from "../comm/MenuService";
import {StartScreenService} from "../comm/StartScreenService";

@Component({
  selector: 'app-test-table',
  templateUrl: './test-table.component.html',
  styleUrls: ['./test-table.component.css'],
})

export class TestTableComponent implements OnDestroy {
  matrix:Array<Array<number>> =[]
  row_length=0
  max_field=-1
  results:Array<Array<number>> =[]
  results_row:Array<number>=[-1]
  matrix_loaded:boolean =false
  test_finished=false
  timerDisplay=""
  time=0

  timer: Subscription | undefined
  http_sub: Array<Subscription>=[]

  errorText: string | null | undefined
  testdata:TestData

  onLoadClick(){
    try {
      this.http_sub?.push(this.http.get<Config>('http://127.0.0.1:8000/'+this.startservice.endpoint+
        '/'+this.startservice.uid,
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
      this.row_length=this.matrix[0].length
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
      this.http_sub?.push(this.http.post<string>('http://127.0.0.1:8000/'+this.startservice.endpoint+
        '/'+this.startservice.uid,
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
    if (data.status == 204) {
      this.test_finished = true
      this.startservice.finished=true
      console.log(this.results)
    } else if (data.status == 400) {
      this.errorText = "User not in db (will be sent from server later)"
    } else {
      this.errorText = data.statusText
    }
  }

  onImageClick(col:number, row:number){
    //elmenti, hogy be van karikázva:
    if((this.results_row.length==0 || this.row_length*row+col>this.max_field)&&(this.testdata.firstCheckable||col!=0)){
      this.max_field=this.row_length*row+col
      this.results_row.push(this.max_field)
      //konkreét karika:
      this.matrix[row][col]+=100
      console.log(this.results)
      //előzőeket beszürkíti
      //let lastCircled=this.disabledFields[this.disabledFields.length-1]
      //this.disabledFields.concat([...Array(this.row_length*row+col-lastCircled).keys()].map(i => i + lastCircled))
    }
  }

  constructor(private http : HttpClient, private menu:MenuService, private startservice: StartScreenService) {
    this.testdata=this.createTestData()!
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
  createTestData():TestData | null{
    switch (this.startservice.endpoint) {
      case "chairlamp":
        return new TestData(this.startservice.endpoint, "",
          "svg", "50","50", "test_data_disabled", true)
      case "bourdon":
        return new TestData(this.startservice.endpoint, "background: rebeccapurple",
          "???","50","50", "", false)
      case "toulousepieron":
        return new TestData(this.startservice.endpoint, "background: rebeccapurple",
          "png", "50","50", "test_data_disabled",false)
    }
    return null
  }
}
