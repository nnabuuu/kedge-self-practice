/**
 * KnowledgePointId值对象 - 强类型ID
 *
 * 使用Value Object包装ID的好处:
 * 1. 类型安全 - 不会误传其他字符串
 * 2. 验证逻辑集中 - ID格式验证在一处
 * 3. 业务意图明确 - KnowledgePointId vs string
 */
export class KnowledgePointId {
  private constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('Knowledge point ID cannot be empty');
    }
    // 可以添加更多验证,如UUID格式检查
  }

  static from(id: string): KnowledgePointId {
    return new KnowledgePointId(id);
  }

  static fromNullable(id: string | null | undefined): KnowledgePointId | null {
    if (!id) return null;
    return new KnowledgePointId(id);
  }

  toString(): string {
    return this.value;
  }

  equals(other: KnowledgePointId): boolean {
    if (!other) return false;
    return this.value === other.value;
  }
}
