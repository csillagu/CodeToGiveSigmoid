import {Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {HttpClient, HttpHeaders, HttpResponse} from "@angular/common/http";
import {Config, TestData} from "../config/config.service";
import {Subscription} from "rxjs";
import {timer} from "rxjs";
import {MenuService} from "../comm/MenuService";
import {StartScreenService} from "../comm/StartScreenService";
import html2canvas from "html2canvas";

@Component({
  selector: 'app-test-table',
  templateUrl: './test-table.component.html',
  styleUrls: ['./test-table.component.css'],
})
export class TestTableComponent implements OnDestroy, OnInit {
  matrix: Array<Array<number>> = []
  max_field = -1
  cursor = 0

  results: Array<Array<number>> = []
  results_row: Array<number> = [-1]

  row_length = 0
  matrix_loaded: boolean = false
  test_running = false
  timerDisplay = ""
  time = 0

  timer: Subscription | undefined
  http_sub: Array<Subscription> = []

  errorText: string | null | undefined
  testdata: TestData

  @ViewChild('maintable', {static: false})
  maintable!: ElementRef;

  @ViewChild('dl', {static: true})
  dl!: ElementRef;

  @ViewChild('canvas', {static: true})
  canvas!: ElementRef;

  capturedImage: any

  private ctx!: CanvasRenderingContext2D;

  constructor(private http: HttpClient, private menu: MenuService, private startservice: StartScreenService) {
    this.testdata = this.createTestData()!
    this.onLoadClick()


  }

  ngOnInit() {
    //this.ctx = this.canvas.nativeElement.getContext('2d');
  }


  onLoadClick() {
    try {
      this.http_sub?.push(this.http.get<Config>('http://127.0.0.1:8000/' + this.startservice.endpoint +
        '/' + this.startservice.uid,
        {responseType: 'json', observe: "response", headers: {}})
        .subscribe(data => this.processGetResponse(data),
          error => {
            this.errorText = error
          }))
    } catch (e) {
      console.log("error")
      this.errorText = "HOGY KELL EXCEPTIONBOL STRINGET KISZEDNI????"
    }
  }

  private processGetResponse(data: HttpResponse<Config>) {
    if ((+data.status) == 200) {
      this.matrix = data.body!.matrix
      this.row_length = this.matrix[0].length
      this.matrix_loaded = true
      this.test_running = true
      this.startTimer()
    } else {
      this.errorText = data.statusText
    }
  }

  submit() {

    this.results.push(this.results_row)

    this.timer?.unsubscribe()

    html2canvas(this.maintable.nativeElement).then((canvas) => {
      this.capturedImage = canvas.toDataURL('image/jpeg');//test
      this.http_sub?.push(
        this.http.post<string>('http://127.0.0.1:8000/' + this.startservice.endpoint + '/' + this.startservice.uid,
          {
            image: this.capturedImage,
            circled: this.results,
            finished: this.time
          },
          {observe: "response"})
          .subscribe((data) => this.processPostResponse(data),
            error => {
              this.errorText = error
            })
      );

    });
  }

  private processPostResponse(data: HttpResponse<string>) {
    console.log(data.status)
    this.matrix_loaded = false
    if (data.status == 204) {
      this.test_running = false
      this.startservice.finished = true
      console.log(this.results)
    } else if (data.status == 400) {
      this.errorText = "User not in db (will be sent from server later)"
    } else {
      this.errorText = data.statusText
    }
  }

  onImageClick(col
                 :
                 number, row
                 :
                 number
  ) {

    this.cursor = this.row_length * row + col
    //elmenti, hogy be van karikázva:
    if ((this.results_row.length == 0 || this.row_length * row + col > this.max_field) && (this.testdata.firstCheckable || col != 0)) {
      this.max_field = this.row_length * row + col
      this.results_row.push(this.max_field)
      //konkreét karika:
      this.setCircled(row, col);
      console.log(this.results)
    }
  }

  private setCircled(row: number, col: number) {
    //modify picture name
    this.matrix[row][col] += 100
  }


  @HostListener('window:beforeunload')
  confirmLeavingPageBeforeSaving()
    :
    boolean {
    return !this.test_running;
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyEvent(event
                   :
                   KeyboardEvent
  ) {
    let col_length = this.matrix.length
    let max_index = col_length * this.row_length
    switch (event.code) {
      case "ArrowRight":
        if (this.cursor < max_index - 1)
          this.cursor++
        break
      case "ArrowDown":
        if (this.cursor + this.row_length < max_index)
          this.cursor += this.row_length
        break
      case "ArrowLeft":
        if (this.cursor > 0)
          this.cursor--
        break
      case"ArrowUp":
        if (this.cursor >= this.row_length)
          this.cursor -= this.row_length
        break
      case "Space":
        console.log("Space")
        event.preventDefault();
        this.onImageClick(this.cursor % this.row_length, Math.floor(this.cursor / this.row_length))
        break
      case "Enter":

        break
    }
    console.log(event);
  }

  ngOnDestroy()
    :
    void {
    console.log("OnDestroy")
    for (let httpSubElement of this.http_sub
      ) {
      httpSubElement.unsubscribe()
    }
    this.timer?.unsubscribe()
  }

  getDisplayTimer(time
                    :
                    number
  ) {
    const minutes = '' + Math.floor(time % 3600 / 60);
    const seconds = '0' + Math.floor(time % 3600 % 60);
    return minutes.slice(-2, -1) + minutes.slice(-1) + ":" +
      seconds.slice(-2, -1) + seconds.slice(-1)

  }

  startTimer() {
    this.timer = timer(0, 1000).subscribe(ec => {

      this.time++;
      this.timerDisplay = this.getDisplayTimer(this.time);
      this.menu.timeRunning = this.matrix_loaded
      this.menu.timeDisplay = this.timerDisplay
      if (this.time == 30) {
        this.submit()
      }
      if (this.time % 10 == 0) {
        this.results.push([...this.results_row])
      }
    });
  }

  createTestData()
    :
    TestData | null {
    this.menu.endpoint = this.startservice.endpoint
    switch (this.startservice.endpoint) {
      case "chairlamp":
        return new TestData(this.startservice.endpoint, "",
          "svg", "50", "50", "test_data_disabled", true, "selected")
      case "bourdon":
        return new TestData(this.startservice.endpoint, "background: rebeccapurple",
          "svg", "25", "25", "test_data_disabled", false, "selected")
      case "toulousepieron":
        return new TestData(this.startservice.endpoint, "background: rebeccapurple",
          "png", "50", "50", "test_data_disabled", false, "selected")
    }
    return null
  }

  cpImg() {

  }
}
