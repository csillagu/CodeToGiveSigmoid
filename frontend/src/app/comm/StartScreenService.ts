import {Injectable} from "@angular/core";

@Injectable({
  providedIn: "root"
})
export class StartScreenService{
  endpoint=""
  uid=""
  error:boolean=false
  finished:boolean=false
}
