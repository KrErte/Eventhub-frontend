import { Component } from '@angular/core';
import { CURRENT_STATE, DEV_STAGES, DevCommit, NEXT_STEPS, REPO_URLS } from './dev-log.data';

@Component({
  selector: 'app-dev-log',
  templateUrl: './dev-log.html',
  styleUrl: './dev-log.scss',
})
export class DevLog {
  protected readonly stages = DEV_STAGES;
  protected readonly currentState = CURRENT_STATE;
  protected readonly nextSteps = NEXT_STEPS;

  protected commitUrl(commit: DevCommit): string {
    return `${REPO_URLS[commit.repo]}/commit/${commit.hash}`;
  }
}
