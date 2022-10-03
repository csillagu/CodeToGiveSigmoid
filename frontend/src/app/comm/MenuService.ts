import {Injectable} from "@angular/core";

@Injectable({
  providedIn: "root"
})
export class MenuService{
  timeDisplay:string=""
  timeRunning:boolean=false
  uid=""
  constructor() {
  }
}
