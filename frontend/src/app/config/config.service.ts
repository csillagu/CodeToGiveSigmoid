
export interface Config {
  matrix: Array<Array<number>>
}
export class TestData{
  constructor(public type:string,
              public ext:string, public width:string, public height:string, public disbledClass:string,
              public firstCheckable:boolean, public selectedClass:string) {

  }

}

