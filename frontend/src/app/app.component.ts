import { Component } from '@angular/core';
import {StartScreenService} from "./comm/StartScreenService";

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
  constructor(public service:StartScreenService) {
    let uid=window.location.href.split('/')[window.location.href.split('/').length-1]
    let endpoint=window.location.href.split('/')[window.location.href.split('/').length-2]
    if(uid=="") {
      this.isError=true
      this.errorText="Missing user id"
      service.error=true
    }else if(endpoint==""){
      this.isError=true
      this.errorText="Missing endpoint"
      service.error=true
    }else{
      service.uid=uid


      var title_endpoint_map = new Map ([
        ["chairlamp",  "Chair-Lamp Test"],
        ["toulousepieron",  "Toulouse-Piéron Cancelation Test"],
        ["bourdon",  "Bourdon Test"],
      ]);

      this.title=title_endpoint_map.get(endpoint) || "Unknown Test"
      service.endpoint=endpoint
    }
  }

  changeLang(lang: string) {
   localStorage.setItem('Language', lang);
   location.reload();
}

  start_test() {
    console.log('hello')
    this.test_started = true
  }
}
