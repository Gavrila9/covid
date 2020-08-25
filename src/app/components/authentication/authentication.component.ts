import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormGroupDirective, NgForm, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { UserService } from '../../service/user.service';

@Component({
  selector: 'app-authentication',
  templateUrl: './authentication.component.html',
  styleUrls: ['./authentication.component.css']
})
export class AuthenticationComponent implements OnInit {
  matcher = new MyErrorStateMatcher();
  form: FormGroup;

  constructor(private userService: UserService, private fb: FormBuilder, private snackBar: MatSnackBar, private router: Router) {
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      username: new FormControl('', Validators.required),
      password: new FormControl('', Validators.required),
      confirmPassword: new FormControl('', Validators.required)
    }, { validators: this.passwordValidator });

  }

  passwordValidator: ValidatorFn = (control: FormGroup): ValidationErrors | null => {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    return password && confirmPassword && password.value === confirmPassword.value ?
      null : { 'not-match': true };
  }

  login() {
    const loginInfo = {
      userName: this.form.value.username,
      password: this.form.value.password
    }

    this.userService.login(loginInfo).subscribe((res: { message: string, username, token?: string }) => {
      if (res.message === 'Login fail, wrong password') {
        this.snackBar.open(res.message, 'Dismiss', { duration: 2000 })
      } else {
        this.userService.token = res.token;
        this.userService.username = res.username;
        this.router.navigate(['dashboard'])
      }
    })
  }

  register() {
    const registerInfo = {
      username: this.form.value.username,
      password: this.form.value.password
    }

    this.userService.register(registerInfo).subscribe((res: { message: string }) => {
      this.snackBar.open(res.message, 'Dismiss', { duration: 2000 })
      // if(res.message === 'Login fail, wrong password') {
      //   this.snackBar.open(res.message, 'Dismiss', { duration: 2000})
      // } else {
      //   this.userService.token = res.token;
      // }
    })
  }

}

class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    return control && control.touched && form && (form.hasError('not-match') || control.hasError('required'));
  }
}
