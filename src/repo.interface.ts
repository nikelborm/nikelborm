export interface IRepo {
  name: string;
  isItArchived: boolean;
  isTemplate: boolean;
  lastTimeBeenPushedInto: Date | null;
  owner: string;
}
