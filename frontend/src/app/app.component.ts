import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Code To Give ';
  test_started = false;
  isError:boolean=false
  errorText:string=""
  constructor() {
    let uid=window.location.href.split('/')[window.location.href.split('/').length-1]
    let endpoint=window.location.href.split('/')[window.location.href.split('/').length-2]
    if(uid=="") {
      this.isError=true
      this.errorText="Missing user id"
    }else if(endpoint==""){
      this.isError=true
      this.errorText="Missing endpoint"
    }
  }
  start_test(){
    console.log('hello')
    this.test_started = true
}

}
