export class UnreadMessageDto {
  private senderId: number;
  private count: number;

  constructor(sender_id: number, cnt: number) {
    this.senderId = sender_id;
    this.count = cnt;
  }

  getSenderId(): number {
    return this.senderId;
  }

  getCount(): number {
    return this.count;
  }

  setSenderId(senderId: number): void {
    this.senderId = senderId;
  }

  setCount(count: number): void {
    this.count = count;
  }
}
