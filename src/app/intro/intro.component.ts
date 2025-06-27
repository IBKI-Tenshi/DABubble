import { Component, OnInit } from '@angular/core';
import { Router, RouterModule, ActivatedRoute } from '@angular/router'; 
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-intro',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './intro.component.html',
  styleUrls: ['./intro.component.scss']
})
export class IntroComponent implements OnInit {
  showAnimation = true;
  fadeOut = false;

  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {
    const isLoggedIn = !!localStorage.getItem('google_token');
    
    if (isLoggedIn) {
      this.showAnimation = false;
      this.router.navigate(['/dashboard']);
    } else {
      this.runAnimation();
    }
  }
  
  runAnimation() {
    
    setTimeout(() => {
      this.fadeOut = true;
      
      setTimeout(() => {
        this.showAnimation = false;
        this.router.navigate(['']);
      }, 600);
      
    }, 1500);
  }
}