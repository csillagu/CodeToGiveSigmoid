import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Code To Give ';
  test_started = false;


  start_test(){
    console.log('hello')
    this.test_started = true
}

}
