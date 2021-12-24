import { Stack } from "aws-cdk-lib";
import { AttributeType, Table } from "aws-cdk-lib/aws-dynamodb";

export class GenericTable {
  private name: string
  private primaryKey: string
  private stack: Stack
  private table: Table

  public constructor(name: string, primaryKey: string, stack: Stack) {
    this.name = name
    this.primaryKey = primaryKey
    this.stack = stack
    this.initialize()
  }

  // use private methods to organise code in OOP way
  private initialize() {
    this.createTable()
  }

  private createTable() {
    this.table = new Table(this.stack, this.name, {
      // partitionKey is primary key
      partitionKey: {
        name: this.primaryKey,
        type: AttributeType.STRING // AttributeType is enum
      },
      tableName: this.name
    })
  }
}