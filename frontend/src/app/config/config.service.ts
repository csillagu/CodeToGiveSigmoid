
export interface Config {
  matrix: Array<Array<number>>
}
export class TestData{
  constructor(public type:string, public firstColumnStyle:string,
              public ext:string, public width:string, public height:string, public disbledStyle:string,
              public firstCheckable:boolean) {

  }

}

