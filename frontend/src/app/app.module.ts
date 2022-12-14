import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { TmpButtonComponent } from './tmp-button/tmp-button.component';
import {HttpClientModule} from "@angular/common/http";

import { LeftMenuComponent } from './left-menu/left-menu.component';
import { ContrastSwitchComponent } from './contrast-switch/contrast-switch.component';
import {MenuService} from "./comm/MenuService";
import {FlexLayoutModule} from "@angular/flex-layout";
import {TestTableComponent} from "./test-table/test-table.component";
import {StartScreenService} from "./comm/StartScreenService";
import {RouterModule} from "@angular/router";


@NgModule({
  declarations: [
    AppComponent,
    TmpButtonComponent,
    TestTableComponent,
    LeftMenuComponent,
    ContrastSwitchComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FlexLayoutModule
  ],
  providers: [MenuService, StartScreenService],
  bootstrap: [AppComponent]
})
export class AppModule {
}
