export class SessionNotFoundException extends Error {
  constructor(sessionId: string) {
    super(`Practice session not found: ${sessionId}`);
    this.name = 'SessionNotFoundException';
  }
}

export class UserNotFoundException extends Error {
  constructor(userId: string) {
    super(`User not found: ${userId}`);
    this.name = 'UserNotFoundException';
  }
}

export class InvalidSessionIdException extends Error {
  constructor(sessionId: string) {
    super(`Invalid session ID format: ${sessionId}`);
    this.name = 'InvalidSessionIdException';
  }
}

export class LeaderboardAccessDeniedException extends Error {
  constructor(message: string = 'Access denied to leaderboard data') {
    super(message);
    this.name = 'LeaderboardAccessDeniedException';
  }
}