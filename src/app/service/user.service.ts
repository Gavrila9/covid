import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DataPoint } from '../model/data-point';

@Injectable()
export class UserService {
  private readonly registerURL: string = '/register'
  private readonly loginURL: string = '/login'
  private readonly logoutURL: string = '/logOut'

  token: string;
  username: string;

  constructor(private http: HttpClient) {
  }

  register(registerInfo: {username: string, password: string}) {
    return this.http.post(this.registerURL, registerInfo)
  }

  login(loginInfo: {userName: string, password: string}) {
    return this.http.get(this.loginURL, { params: loginInfo })
  }

  logout() {
    return this.http.get(this.logoutURL, { params: { userName: this.username } })
  }
}
