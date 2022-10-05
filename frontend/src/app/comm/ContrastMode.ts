import {Injectable} from "@angular/core";

@Injectable({
  providedIn: "root"
})
export class ContrastMode{
  contrastOn:boolean=false;
  constructor() {
  }
}
