export class UnreadMessageDto {
  private messageId: number;
  private senderId: number;
  private text: string;
  private date: Date;

  constructor(messageId: number, sender_id: number, text: string, date: Date) {
    this.senderId = sender_id;
    this.messageId = messageId;
    this.text = text;
    this.date = date;
  }

  get MessageId(): number {
    return this.messageId;
  }

  get SenderId(): number {
    return this.senderId;
  }

  get Text(): string {
    return this.text;
  }

  get Date(): Date {
    return this.date;
  }

  set MessageId(messageId: number) {
    this.messageId = messageId;
  }

  set SenderId(senderId: number) {
    this.senderId = senderId;
  }

  set Text(text: string) {
    this.text = text;
  }

  set Date(date: Date) {
    this.date = date;
  }
}
