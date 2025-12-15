## ADDED Requirements

### Requirement: Knowledge Point Sort Index

The system SHALL support explicit ordering of knowledge points via a `sort_index` field to enable correct display of Chinese ordinal curriculum structures (e.g., 第一单元, 第二单元, 第三单元).

#### Scenario: Knowledge points ordered by sort_index
- **WHEN** knowledge points are retrieved for display
- **THEN** they SHALL be ordered by `sort_index ASC, id ASC`
- **AND** the ordering SHALL be consistent across all knowledge point queries

#### Scenario: Sort index defaults to zero for new records
- **WHEN** a knowledge point is created without specifying a sort_index
- **THEN** the sort_index SHALL default to 0
- **AND** the knowledge point SHALL appear after any explicitly ordered items with the same parent

#### Scenario: Sort index populated during Excel import
- **WHEN** knowledge points are imported from an Excel file
- **THEN** the sort_index SHALL be auto-populated based on row order in the Excel file
- **AND** the first row SHALL receive sort_index 1, second row sort_index 2, etc.

### Requirement: Backwards Compatibility for Knowledge Point Ordering

The system SHALL maintain backwards compatibility for existing knowledge point data that lacks explicit sort_index values.

#### Scenario: Existing data displays in ID order
- **GIVEN** knowledge points exist without sort_index values (or all have sort_index = 0)
- **WHEN** they are displayed in the UI
- **THEN** they SHALL appear in insertion order (by ID)
- **AND** no data migration is required for the system to function

### Requirement: Knowledge Point Query Performance

The system SHALL maintain performant knowledge point queries when ordering by sort_index.

#### Scenario: Indexed query for knowledge point listing
- **GIVEN** a composite index exists on `(topic, volume, sort_index)`
- **WHEN** knowledge points are queried with filters on topic and volume
- **THEN** the query SHALL use the index for efficient ordering
