import {
    ImportedWorkflowStep,
    WorkflowAction,
    WorkflowIssue,
    WorkflowPreflightResult,
    WorkflowStepValidation
} from './types';

export const isValidWorkflowAction = (
    value: unknown
): value is WorkflowAction => {
    if (
        typeof value !== 'object' ||
        value === null
    ) {
        return false;
    }

    const action = value as Record<string, unknown>;

    return (
        typeof action.id === 'string' &&
        typeof action.type === 'string' &&
        action.type.length > 0 &&
        (
            action.source === 'gui' ||
            action.source === 'nl' ||
            action.source === 'imported'
        ) &&
        typeof action.label === 'string' &&
        (
            action.target === undefined ||
            action.target === 'rows' ||
            action.target === 'columns' ||
            action.target === 'both' ||
            action.target === 'matrix'
        ) &&
        typeof action.parameters === 'object' &&
        action.parameters !== null &&
        !Array.isArray(action.parameters) &&
        typeof action.createdAt === 'string'
    );
};

export interface WorkflowDatasetContext {
    columnMetadataFields: string[];
    rowMetadataFields: string[];
    columnMetadataValues: Record<string, string[]>;
    rowMetadataValues: Record<string, string[]>;
    rowFeatures: string[];
    columnFeatures: string[];
    rowCount?: number;
    columnCount?: number;
}

export const validateWorkflowActionAgainstDataset = (
    action: WorkflowAction,
    context: WorkflowDatasetContext
): WorkflowStepValidation => {
    if (action.type === 'zscore') {
        const axis = action.parameters.axis;

        if (
            axis !== 'row' &&
            axis !== 'col'
        ) {
            return {
                status: 'needs_resolution',
                issues: [
                    {
                        code: 'INVALID_PARAMETER',
                        message:
                            'Z-score axis must be either "row" or "col".',
                        parameter: 'axis',
                        availableValues: ['row', 'col']
                    }
                ]
            };
        }
    }

    if (action.type === 'sort') {
        const method = action.parameters.method;

        const validMethods = [
            'alphabetically',
            'sum',
            'variance'
        ];

        if (
            typeof method !== 'string' ||
            !validMethods.includes(method)
        ) {
            return {
                status: 'needs_resolution',
                issues: [
                    {
                        code: 'INVALID_PARAMETER',
                        message:
                            'Sort method must be "alphabetically", "sum", or "variance".',
                        parameter: 'method',
                        availableValues: validMethods
                    }
                ]
            };
        }
    }

    if (action.type === 'cluster') {
        const target = action.parameters.target;

        const validTargets = [
            'rows',
            'columns',
            'both'
        ];

        if (
            typeof target !== 'string' ||
            !validTargets.includes(target)
        ) {
            return {
                status: 'needs_resolution',
                issues: [
                    {
                        code: 'INVALID_PARAMETER',
                        message:
                            'Cluster target must be "rows", "columns", or "both".',
                        parameter: 'target',
                        availableValues: validTargets
                    }
                ]
            };
        }

        if (
            action.target !== undefined &&
            action.target !== target
        ) {
            return {
                status: 'needs_resolution',
                issues: [
                    {
                        code: 'INVALID_PARAMETER',
                        message:
                            'Cluster target does not match the action target.',
                        parameter: 'target',
                        availableValues: validTargets
                    }
                ]
            };
        }
    }

    if (action.type === 'set_distance') {
        const distance = action.parameters.distance;

        const validDistances = [
            'euclidean',
            'cosine',
            'correlation',
            'manhattan'
        ];

        if (
            typeof distance !== 'string' ||
            !validDistances.includes(distance)
        ) {
            return {
                status: 'needs_resolution',
                issues: [
                    {
                        code: 'INVALID_PARAMETER',
                        message:
                            'Distance metric must be "euclidean", "cosine", "correlation", or "manhattan".',
                        parameter: 'distance',
                        availableValues: validDistances
                    }
                ]
            };
        }

        if (action.target !== 'both') {
            return {
                status: 'needs_resolution',
                issues: [
                    {
                        code: 'INVALID_PARAMETER',
                        message:
                            'Distance metric applies to both clustering axes.',
                        parameter: 'target',
                        availableValues: ['both']
                    }
                ]
            };
        }
    }

    if (action.type === 'set_linkage') {
        const linkage = action.parameters.linkage;

        const validLinkages = [
            'average',
            'complete',
            'single'
        ];

        if (
            typeof linkage !== 'string' ||
            !validLinkages.includes(linkage)
        ) {
            return {
                status: 'needs_resolution',
                issues: [
                    {
                        code: 'INVALID_PARAMETER',
                        message:
                            'Linkage method must be "average", "complete", or "single".',
                        parameter: 'linkage',
                        availableValues: validLinkages
                    }
                ]
            };
        }

        if (action.target !== 'both') {
            return {
                status: 'needs_resolution',
                issues: [
                    {
                        code: 'INVALID_PARAMETER',
                        message:
                            'Linkage method applies to both clustering axes.',
                        parameter: 'target',
                        availableValues: ['both']
                    }
                ]
            };
        }
    }

    if (action.type === 'set_clustering') {
        const distance = action.parameters.distance;
        const linkage = action.parameters.linkage;

        const validDistances = [
            'euclidean',
            'cosine',
            'correlation',
            'manhattan'
        ];

        const validLinkages = [
            'average',
            'complete',
            'single'
        ];

        if (
            typeof distance !== 'string' ||
            !validDistances.includes(distance)
        ) {
            return {
                status: 'needs_resolution',
                issues: [
                    {
                        code: 'INVALID_PARAMETER',
                        message:
                            'Clustering distance must be "euclidean", "cosine", "correlation", or "manhattan".',
                        parameter: 'distance',
                        availableValues: validDistances
                    }
                ]
            };
        }

        if (
            typeof linkage !== 'string' ||
            !validLinkages.includes(linkage)
        ) {
            return {
                status: 'needs_resolution',
                issues: [
                    {
                        code: 'INVALID_PARAMETER',
                        message:
                            'Clustering linkage must be "average", "complete", or "single".',
                        parameter: 'linkage',
                        availableValues: validLinkages
                    }
                ]
            };
        }

        if (action.target !== 'both') {
            return {
                status: 'needs_resolution',
                issues: [
                    {
                        code: 'INVALID_PARAMETER',
                        message:
                            'Clustering configuration applies to both axes.',
                        parameter: 'target',
                        availableValues: ['both']
                    }
                ]
            };
        }
    }

    if (action.type === 'set_opacity') {
        const value = action.parameters.value;

        if (
            typeof value !== 'number' ||
            !Number.isFinite(value) ||
            value < 0.5 ||
            value > 3
        ) {
            return {
                status: 'needs_resolution',
                issues: [
                    {
                        code: 'INVALID_PARAMETER',
                        message:
                            'Opacity must be a number between 0.5 and 3.',
                        parameter: 'value'
                    }
                ]
            };
        }

        if (action.target !== 'matrix') {
            return {
                status: 'needs_resolution',
                issues: [
                    {
                        code: 'INVALID_PARAMETER',
                        message:
                            'Opacity applies to the matrix visualization.',
                        parameter: 'target',
                        availableValues: ['matrix']
                    }
                ]
            };
        }
    }

    if (action.type === 'sort_by_metadata') {
        const field = action.parameters.field;

        if (
            action.target !== 'rows' &&
            action.target !== 'columns'
        ) {
            return {
                status: 'needs_resolution',
                issues: [
                    {
                        code: 'INVALID_PARAMETER',
                        message:
                            'Metadata sorting must target either rows or columns.',
                        parameter: 'target',
                        availableValues: ['rows', 'columns']
                    }
                ]
            };
        }

        if (
            typeof field !== 'string' ||
            field.length === 0
        ) {
            return {
                status: 'needs_resolution',
                issues: [
                    {
                        code: 'INVALID_PARAMETER',
                        message:
                            'Metadata sort is missing a valid field.',
                        parameter: 'field'
                    }
                ]
            };
        }

        const availableFields =
            action.target === 'rows'
                ? context.rowMetadataFields
                : context.columnMetadataFields;

        if (!availableFields.includes(field)) {
            return {
                status: 'needs_resolution',
                issues: [
                    {
                        code: 'MISSING_METADATA_FIELD',
                        message:
                            `Metadata field "${field}" is not available for ${action.target} in the current dataset.`,
                        parameter: 'field',
                        availableValues: availableFields
                    }
                ]
            };
        }
    }

    if (action.type === 'sort_by_expression') {
        const feature = action.parameters.feature;


        // Both rows and columns can be sorted by expression.
        // Use the target explicitly recorded in the workflow.
        if (action.target !== 'rows' && action.target !== 'columns') {
            return {
                status: 'needs_resolution',
                issues: [
                    {
                        code: 'INVALID_PARAMETER',
                        message:
                            'Expression sorting requires a valid target axis.',
                        parameter: 'target',
                        availableValues: ['rows', 'columns']
                    }
                ]
            };
        }

        if (
            typeof feature !== 'string' ||
            feature.length === 0
        ) {
            return {
                status: 'needs_resolution',
                issues: [
                    {
                        code: 'INVALID_PARAMETER',
                        message:
                            'Expression sort is missing a valid feature.',
                        parameter: 'feature'
                    }
                ]
            };
        }

        const availableFeatures =
            action.target === 'rows'
                ? context.columnFeatures
                : context.rowFeatures;

        if (!availableFeatures.includes(feature)) {
            return {
                status: 'needs_resolution',
                issues: [
                    {
                        code: 'MISSING_FEATURE',
                        message:
                            `Feature "${feature}" is not available in the current dataset.`,
                        parameter: 'feature',
                        availableValues: availableFeatures
                    }
                ]
            };
        }
    }

    if (action.type === 'transpose') {
        const orientation = action.parameters.orientation;
        const transposed = action.parameters.transposed;

        const validOrientations = [
            'Original',
            'Transposed'
        ];

        if (
            typeof orientation !== 'string' ||
            !validOrientations.includes(orientation)
        ) {
            return {
                status: 'needs_resolution',
                issues: [
                    {
                        code: 'INVALID_PARAMETER',
                        message:
                            'Matrix orientation must be "Original" or "Transposed".',
                        parameter: 'orientation',
                        availableValues: validOrientations
                    }
                ]
            };
        }

        if (typeof transposed !== 'boolean') {
            return {
                status: 'needs_resolution',
                issues: [
                    {
                        code: 'INVALID_PARAMETER',
                        message:
                            'Transpose state must be true or false.',
                        parameter: 'transposed'
                    }
                ]
            };
        }

        const expectedTransposed =
            orientation === 'Transposed';

        if (transposed !== expectedTransposed) {
            return {
                status: 'needs_resolution',
                issues: [
                    {
                        code: 'INVALID_PARAMETER',
                        message:
                            'Transpose state does not match the selected orientation.',
                        parameter: 'transposed'
                    }
                ]
            };
        }

        if (action.target !== 'matrix') {
            return {
                status: 'needs_resolution',
                issues: [
                    {
                        code: 'INVALID_PARAMETER',
                        message:
                            'Transpose must target the matrix.',
                        parameter: 'target',
                        availableValues: ['matrix']
                    }
                ]
            };
        }
    }

    if (action.type === 'crop') {
        const rowIndices = action.parameters.rowIndices;
        const columnIndices = action.parameters.columnIndices;
        const rowCount = action.parameters.rowCount;
        const columnCount = action.parameters.columnCount;
        const orientationAtSelection =
            action.parameters.orientationAtSelection;
        const indexSpace = action.parameters.indexSpace;
        const requiresCompatibleOrdering =
            action.parameters.requiresCompatibleOrdering;

        const validIndexArray = (
            value: unknown
        ): value is number[] =>
            Array.isArray(value) &&
            value.length > 0 &&
            value.every(
                index =>
                    typeof index === 'number' &&
                    Number.isInteger(index) &&
                    index >= 0
            );

        if (!validIndexArray(rowIndices)) {
            return {
                status: 'needs_resolution',
                issues: [
                    {
                        code: 'INVALID_PARAMETER',
                        message:
                            'Crop row indices must be a non-empty list of non-negative integers.',
                        parameter: 'rowIndices'
                    }
                ]
            };
        }

        if (!validIndexArray(columnIndices)) {
            return {
                status: 'needs_resolution',
                issues: [
                    {
                        code: 'INVALID_PARAMETER',
                        message:
                            'Crop column indices must be a non-empty list of non-negative integers.',
                        parameter: 'columnIndices'
                    }
                ]
            };
        }

        if (
            typeof context.rowCount === 'number' &&
            rowIndices.some(
                index => index >= context.rowCount!
            )
        ) {
            return {
                status: 'needs_resolution',
                issues: [
                    {
                        code: 'INVALID_PARAMETER',
                        message:
                            'One or more crop row indices are outside the bounds of the current dataset.',
                        parameter: 'rowIndices'
                    }
                ]
            };
        }

        if (
            typeof context.columnCount === 'number' &&
            columnIndices.some(
                index => index >= context.columnCount!
            )
        ) {
            return {
                status: 'needs_resolution',
                issues: [
                    {
                        code: 'INVALID_PARAMETER',
                        message:
                            'One or more crop column indices are outside the bounds of the current dataset.',
                        parameter: 'columnIndices'
                    }
                ]
            };
        }

        if (
            typeof rowCount !== 'number' ||
            rowCount !== rowIndices.length
        ) {
            return {
                status: 'needs_resolution',
                issues: [
                    {
                        code: 'INVALID_PARAMETER',
                        message:
                            'Crop row count does not match the stored row indices.',
                        parameter: 'rowCount'
                    }
                ]
            };
        }

        if (
            typeof columnCount !== 'number' ||
            columnCount !== columnIndices.length
        ) {
            return {
                status: 'needs_resolution',
                issues: [
                    {
                        code: 'INVALID_PARAMETER',
                        message:
                            'Crop column count does not match the stored column indices.',
                        parameter: 'columnCount'
                    }
                ]
            };
        }

        if (
            orientationAtSelection !== 'Original' &&
            orientationAtSelection !== 'Transposed'
        ) {
            return {
                status: 'needs_resolution',
                issues: [
                    {
                        code: 'INVALID_PARAMETER',
                        message:
                            'Crop orientation must be "Original" or "Transposed".',
                        parameter: 'orientationAtSelection',
                        availableValues: ['Original', 'Transposed']
                    }
                ]
            };
        }

        if (indexSpace !== 'canonical') {
            return {
                status: 'needs_resolution',
                issues: [
                    {
                        code: 'INVALID_PARAMETER',
                        message:
                            'Crop indices must use canonical index space.',
                        parameter: 'indexSpace',
                        availableValues: ['canonical']
                    }
                ]
            };
        }

        if (requiresCompatibleOrdering !== true) {
            return {
                status: 'needs_resolution',
                issues: [
                    {
                        code: 'INVALID_PARAMETER',
                        message:
                            'Crop requires compatible workflow ordering.',
                        parameter: 'requiresCompatibleOrdering'
                    }
                ]
            };
        }

        if (action.target !== 'matrix') {
            return {
                status: 'needs_resolution',
                issues: [
                    {
                        code: 'INVALID_PARAMETER',
                        message:
                            'Crop must target the matrix.',
                        parameter: 'target',
                        availableValues: ['matrix']
                    }
                ]
            };
        }
    }

    if (action.type === 'clear_crop') {
        if (action.target !== 'matrix') {
            return {
                status: 'needs_resolution',
                issues: [
                    {
                        code: 'INVALID_PARAMETER',
                        message:
                            'Clear crop must target the matrix.',
                        parameter: 'target',
                        availableValues: ['matrix']
                    }
                ]
            };
        }

        if (Object.keys(action.parameters).length !== 0) {
            return {
                status: 'needs_resolution',
                issues: [
                    {
                        code: 'INVALID_PARAMETER',
                        message:
                            'Clear crop does not accept parameters.'
                    }
                ]
            };
        }
    }

    if (action.type === 'clear_filters') {
        if (action.target !== 'matrix') {
            return {
                status: 'needs_resolution',
                issues: [
                    {
                        code: 'INVALID_PARAMETER',
                        message:
                            'Clear filters must target the matrix.',
                        parameter: 'target',
                        availableValues: ['matrix']
                    }
                ]
            };
        }

        if (Object.keys(action.parameters).length !== 0) {
            return {
                status: 'needs_resolution',
                issues: [
                    {
                        code: 'INVALID_PARAMETER',
                        message:
                            'Clear filters does not accept parameters.'
                    }
                ]
            };
        }
    }

    if (action.type === 'remove_filters') {
        const filters = action.parameters.filters;

        if (
            !Array.isArray(filters) ||
            filters.length === 0
        ) {
            return {
                status: 'needs_resolution',
                issues: [
                    {
                        code: 'INVALID_PARAMETER',
                        message:
                            'Remove filters requires at least one filter.',
                        parameter: 'filters'
                    }
                ]
            };
        }

        const validDescriptors = filters.every(filter => {
            if (
                typeof filter !== 'object' ||
                filter === null ||
                Array.isArray(filter)
            ) {
                return false;
            }

            const descriptor =
                filter as Record<string, unknown>;

            return (
                (descriptor.axis === 'row' ||
                    descriptor.axis === 'col') &&
                typeof descriptor.type === 'string' &&
                descriptor.type.length > 0
            );
        });

        if (!validDescriptors) {
            return {
                status: 'needs_resolution',
                issues: [
                    {
                        code: 'INVALID_PARAMETER',
                        message:
                            'Each removed filter must have a valid axis and filter type.',
                        parameter: 'filters'
                    }
                ]
            };
        }

        const removedAxes = new Set(
            filters.map(filter =>
                (filter as Record<string, unknown>).axis
            )
        );

        const expectedTarget =
            removedAxes.size > 1
                ? 'both'
                : removedAxes.has('row')
                    ? 'rows'
                    : 'columns';

        if (action.target !== expectedTarget) {
            return {
                status: 'needs_resolution',
                issues: [
                    {
                        code: 'INVALID_PARAMETER',
                        message:
                            'Remove filters target does not match the stored filter axes.',
                        parameter: 'target',
                        availableValues: [expectedTarget]
                    }
                ]
            };
        }
    }

    if (action.type === 'variance_filter') {
        const topN = action.parameters.topN;
        const metric = action.parameters.metric;

        if (
            typeof topN !== 'number' ||
            !Number.isInteger(topN) ||
            topN <= 0
        ) {
            return {
                status: 'needs_resolution',
                issues: [
                    {
                        code: 'INVALID_PARAMETER',
                        message:
                            'Variance filter topN must be a positive integer.',
                        parameter: 'topN'
                    }
                ]
            };
        }

        if (metric !== 'variance') {
            return {
                status: 'needs_resolution',
                issues: [
                    {
                        code: 'INVALID_PARAMETER',
                        message:
                            'Variance filter metric must be "variance".',
                        parameter: 'metric',
                        availableValues: ['variance']
                    }
                ]
            };
        }

        if (action.target !== 'rows') {
            return {
                status: 'needs_resolution',
                issues: [
                    {
                        code: 'INVALID_PARAMETER',
                        message:
                            'Variance filtering currently targets rows.',
                        parameter: 'target',
                        availableValues: ['rows']
                    }
                ]
            };
        }
    }

    if (action.type === 'filter') {
        const field = action.parameters.field;
        const value = action.parameters.value;
        const operator = action.parameters.operator;
        const mode = action.parameters.mode;
        const criteria = action.parameters.criteria;

        const isMultiFilter =
            mode !== undefined ||
            criteria !== undefined;

        if (isMultiFilter) {
            if (
                action.target !== 'columns' ||
                mode !== 'all' ||
                !Array.isArray(criteria) ||
                criteria.length === 0
            ) {
                return {
                    status: 'needs_resolution',
                    issues: [
                        {
                            code: 'INVALID_PARAMETER',
                            message:
                                'Multi-filter requires target "columns", mode "all", and at least one criterion.',
                            parameter: 'criteria'
                        }
                    ]
                };
            }

            for (const criterion of criteria) {
                if (
                    typeof criterion !== 'object' ||
                    criterion === null ||
                    Array.isArray(criterion)
                ) {
                    return {
                        status: 'needs_resolution',
                        issues: [
                            {
                                code: 'INVALID_PARAMETER',
                                message:
                                    'Each filter criterion must be an object.',
                                parameter: 'criteria'
                            }
                        ]
                    };
                }

                const item =
                    criterion as Record<string, unknown>;

                if (
                    typeof item.field !== 'string' ||
                    item.field.length === 0 ||
                    item.operator !== 'equals' ||
                    item.value === undefined ||
                    item.value === null
                ) {
                    return {
                        status: 'needs_resolution',
                        issues: [
                            {
                                code: 'INVALID_PARAMETER',
                                message:
                                    'Each filter criterion requires a field, value, and "equals" operator.',
                                parameter: 'criteria'
                            }
                        ]
                    };
                }

                if (
                    !context.columnMetadataFields.includes(
                        item.field
                    )
                ) {
                    return {
                        status: 'needs_resolution',
                        issues: [
                            {
                                code: 'MISSING_METADATA_FIELD',
                                message:
                                    `Column metadata field "${item.field}" is not available in the current dataset.`,
                                parameter: 'field',
                                availableValues:
                                    context.columnMetadataFields
                            }
                        ]
                    };
                }

                const availableMetadataValues =
                    context.columnMetadataValues[item.field] ?? [];

                const criterionValue = String(item.value);

                if (
                    availableMetadataValues.length > 0 &&
                    !availableMetadataValues.includes(criterionValue)
                ) {
                    return {
                        status: 'needs_resolution',
                        issues: [
                            {
                                code: 'MISSING_METADATA_VALUE',
                                message:
                                    `Metadata value "${criterionValue}" is not available for field "${item.field}".`,
                                parameter: 'value',
                                availableValues: availableMetadataValues
                            }
                        ]
                    };
                }
            }

            return {
                status: 'ready',
                issues: []
            };
        }

        if (
            action.target !== 'rows' &&
            action.target !== 'columns'
        ) {
            return {
                status: 'needs_resolution',
                issues: [
                    {
                        code: 'INVALID_PARAMETER',
                        message:
                            'Filter target must be rows or columns.',
                        parameter: 'target',
                        availableValues: ['rows', 'columns']
                    }
                ]
            };
        }

        if (
            typeof field !== 'string' ||
            field.length === 0 ||
            operator !== 'equals' ||
            value === undefined ||
            value === null
        ) {
            return {
                status: 'needs_resolution',
                issues: [
                    {
                        code: 'INVALID_PARAMETER',
                        message:
                            'Filter requires a field, value, and "equals" operator.',
                        parameter: 'parameters'
                    }
                ]
            };
        }

        const availableFields =
            action.target === 'rows'
                ? context.rowMetadataFields
                : context.columnMetadataFields;

        if (!availableFields.includes(field)) {
            return {
                status: 'needs_resolution',
                issues: [
                    {
                        code: 'MISSING_METADATA_FIELD',
                        message:
                            `Metadata field "${field}" is not available for ${action.target}.`,
                        parameter: 'field',
                        availableValues: availableFields
                    }
                ]
            };
        }

        const availableMetadataValues =
            action.target === 'rows'
                ? context.rowMetadataValues[field] ?? []
                : context.columnMetadataValues[field] ?? [];

        const filterValue = String(value);

        if (
            availableMetadataValues.length > 0 &&
            !availableMetadataValues.includes(filterValue)
        ) {
            return {
                status: 'needs_resolution',
                issues: [
                    {
                        code: 'MISSING_METADATA_VALUE',
                        message:
                            `Metadata value "${filterValue}" is not available for field "${field}".`,
                        parameter: 'value',
                        availableValues: availableMetadataValues
                    }
                ]
            };
        }
    }

    if (action.type === 'inverse_filter') {
        const field = action.parameters.field;
        const value = action.parameters.value;
        const operator = action.parameters.operator;
        const mode = action.parameters.mode;
        const criteria = action.parameters.criteria;

        const isMultiFilter =
            mode !== undefined ||
            criteria !== undefined;

        if (action.target !== 'columns') {
            return {
                status: 'needs_resolution',
                issues: [
                    {
                        code: 'INVALID_PARAMETER',
                        message:
                            'Inverse filtering currently targets columns.',
                        parameter: 'target',
                        availableValues: ['columns']
                    }
                ]
            };
        }

        if (isMultiFilter) {
            if (
                mode !== 'any' ||
                !Array.isArray(criteria) ||
                criteria.length === 0
            ) {
                return {
                    status: 'needs_resolution',
                    issues: [
                        {
                            code: 'INVALID_PARAMETER',
                            message:
                                'Multi-exclude requires mode "any" and at least one criterion.',
                            parameter: 'criteria'
                        }
                    ]
                };
            }

            for (const criterion of criteria) {
                if (
                    typeof criterion !== 'object' ||
                    criterion === null ||
                    Array.isArray(criterion)
                ) {
                    return {
                        status: 'needs_resolution',
                        issues: [
                            {
                                code: 'INVALID_PARAMETER',
                                message:
                                    'Each exclusion criterion must be an object.',
                                parameter: 'criteria'
                            }
                        ]
                    };
                }

                const item =
                    criterion as Record<string, unknown>;

                if (
                    typeof item.field !== 'string' ||
                    item.field.length === 0 ||
                    item.operator !== 'exclude_equals' ||
                    item.value === undefined ||
                    item.value === null
                ) {
                    return {
                        status: 'needs_resolution',
                        issues: [
                            {
                                code: 'INVALID_PARAMETER',
                                message:
                                    'Each exclusion criterion requires a field, value, and "exclude_equals" operator.',
                                parameter: 'criteria'
                            }
                        ]
                    };
                }

                if (
                    !context.columnMetadataFields.includes(
                        item.field
                    )
                ) {
                    return {
                        status: 'needs_resolution',
                        issues: [
                            {
                                code: 'MISSING_METADATA_FIELD',
                                message:
                                    `Column metadata field "${item.field}" is not available in the current dataset.`,
                                parameter: 'field',
                                availableValues:
                                    context.columnMetadataFields
                            }
                        ]
                    };
                }

                const availableMetadataValues =
                    context.columnMetadataValues[item.field] ?? [];

                const criterionValue = String(item.value);

                if (
                    availableMetadataValues.length > 0 &&
                    !availableMetadataValues.includes(criterionValue)
                ) {
                    return {
                        status: 'needs_resolution',
                        issues: [
                            {
                                code: 'MISSING_METADATA_VALUE',
                                message:
                                    `Metadata value "${criterionValue}" is not available for field "${item.field}".`,
                                parameter: 'value',
                                availableValues: availableMetadataValues
                            }
                        ]
                    };
                }
            }

            return {
                status: 'ready',
                issues: []
            };
        }

        if (
            typeof field !== 'string' ||
            field.length === 0 ||
            operator !== 'exclude_equals' ||
            value === undefined ||
            value === null
        ) {
            return {
                status: 'needs_resolution',
                issues: [
                    {
                        code: 'INVALID_PARAMETER',
                        message:
                            'Inverse filter requires a field, value, and "exclude_equals" operator.',
                        parameter: 'parameters'
                    }
                ]
            };
        }

        if (
            !context.columnMetadataFields.includes(field)
        ) {
            return {
                status: 'needs_resolution',
                issues: [
                    {
                        code: 'MISSING_METADATA_FIELD',
                        message:
                            `Column metadata field "${field}" is not available in the current dataset.`,
                        parameter: 'field',
                        availableValues:
                            context.columnMetadataFields
                    }
                ]
            };
        }

        const availableMetadataValues =
            context.columnMetadataValues[field] ?? [];

        const filterValue = String(value);

        if (
            availableMetadataValues.length > 0 &&
            !availableMetadataValues.includes(filterValue)
        ) {
            return {
                status: 'needs_resolution',
                issues: [
                    {
                        code: 'MISSING_METADATA_VALUE',
                        message:
                            `Metadata value "${filterValue}" is not available for field "${field}".`,
                        parameter: 'value',
                        availableValues: availableMetadataValues
                    }
                ]
            };
        }
    }

    if (action.type === 'rezscore_filtered_subset') {
        const enabled = action.parameters.enabled;
        const axis = action.parameters.axis;

        if (typeof enabled !== 'boolean') {
            return {
                status: 'needs_resolution',
                issues: [
                    {
                        code: 'INVALID_PARAMETER',
                        message:
                            'Re-Z-score filtered subset requires enabled to be a boolean.',
                        parameter: 'enabled',
                        availableValues: ['true', 'false']
                    }
                ]
            };
        }

        if (axis !== 'row' && axis !== 'col') {
            return {
                status: 'needs_resolution',
                issues: [
                    {
                        code: 'INVALID_PARAMETER',
                        message:
                            'Re-Z-score axis must be "row" or "col".',
                        parameter: 'axis',
                        availableValues: ['row', 'col']
                    }
                ]
            };
        }

        const expectedTarget =
            axis === 'row'
                ? 'rows'
                : 'columns';

        if (action.target !== expectedTarget) {
            return {
                status: 'needs_resolution',
                issues: [
                    {
                        code: 'INVALID_PARAMETER',
                        message:
                            'Re-Z-score target does not match the selected axis.',
                        parameter: 'target',
                        availableValues: [expectedTarget]
                    }
                ]
            };
        }
    }

    if (action.type === 'set_cluster_depth') {
        const value = action.parameters.value;

        if (
            typeof value !== 'number' ||
            !Number.isInteger(value) ||
            value < 1 ||
            value > 11
        ) {
            return {
                status: 'needs_resolution',
                issues: [
                    {
                        code: 'INVALID_PARAMETER',
                        message:
                            'Cluster depth must be an integer between 1 and 11.',
                        parameter: 'value'
                    }
                ]
            };
        }

        if (
            action.target !== 'rows' &&
            action.target !== 'columns'
        ) {
            return {
                status: 'needs_resolution',
                issues: [
                    {
                        code: 'INVALID_PARAMETER',
                        message:
                            'Cluster depth must target either rows or columns.',
                        parameter: 'target',
                        availableValues: ['rows', 'columns']
                    }
                ]
            };
        }
    }

    if (action.type === 'set_metadata_categories') {
        const categories = action.parameters.categories;

        if (
            action.target !== 'rows' &&
            action.target !== 'columns'
        ) {
            return {
                status: 'needs_resolution',
                issues: [
                    {
                        code: 'INVALID_PARAMETER',
                        message:
                            'Metadata categories must target either rows or columns.',
                        parameter: 'target',
                        availableValues: ['rows', 'columns']
                    }
                ]
            };
        }

        if (
            !Array.isArray(categories) ||
            !categories.every(
                category => typeof category === 'string'
            )
        ) {
            return {
                status: 'needs_resolution',
                issues: [
                    {
                        code: 'INVALID_PARAMETER',
                        message:
                            'Metadata categories must be an array of field names.',
                        parameter: 'categories'
                    }
                ]
            };
        }

        const availableFields =
            action.target === 'rows'
                ? context.rowMetadataFields
                : context.columnMetadataFields;

        const missingCategory =
            categories.find(
                category =>
                    !availableFields.includes(category)
            );

        if (missingCategory) {
            return {
                status: 'needs_resolution',
                issues: [
                    {
                        code: 'MISSING_METADATA_FIELD',
                        message:
                            `Metadata field "${missingCategory}" is not available for ${action.target} in the current dataset.`,
                        parameter: 'categories',
                        availableValues: availableFields
                    }
                ]
            };
        }
    }

    switch (action.type) {
        case 'filter':
        case 'inverse_filter':
        case 'variance_filter':
        case 'remove_filters':
        case 'clear_filters':
        case 'zscore':
        case 'rezscore_filtered_subset':
        case 'cluster':
        case 'sort':
        case 'sort_by_metadata':
        case 'sort_by_expression':
        case 'set_distance':
        case 'set_linkage':
        case 'set_clustering':
        case 'transpose':
        case 'crop':
        case 'clear_crop':
        case 'set_opacity':
        case 'set_cluster_depth':
        case 'set_metadata_categories':
            return {
                status: 'ready',
                issues: []
            };

        default:
            return {
                status: 'blocked',
                issues: [
                    {
                        code: 'UNSUPPORTED_ACTION',
                        message:
                            `Workflow action "${String(action.type)}" is not supported.`
                    }
                ]
            };
    }
};

export const createImportedWorkflowSteps = (
    actions: WorkflowAction[],
    context: WorkflowDatasetContext
): ImportedWorkflowStep[] =>
    actions.map(action => ({
        originalAction: action,
        resolutionChanges: [],
        included: true,
        validation:
            validateWorkflowActionAgainstDataset(
                action,
                context
            )
    }));

export const getEffectiveWorkflowAction = (
    step: ImportedWorkflowStep
): WorkflowAction =>
    step.resolvedAction ?? step.originalAction;

interface SimulatedFilterDescriptor {
    axis: 'row' | 'col';
    type: string;
    field?: string;
    value?: unknown;
    top_n?: number;
    criteria?: Array<{
        field: string;
        value: unknown;
    }>;
    sourceActionId?: string;
}

export const resolveImportedWorkflowStepParameter = (
    step: ImportedWorkflowStep,
    parameter: string,
    resolvedValue: unknown
): ImportedWorkflowStep => {
    const currentAction =
        getEffectiveWorkflowAction(step);

    const originalValue =
        parameter === 'target'
            ? step.originalAction.target
            : step.originalAction.parameters[parameter];

    const currentValue =
        parameter === 'target'
            ? currentAction.target
            : currentAction.parameters[parameter];

    const resolvedLabel =
        currentValue !== undefined &&
            currentValue !== null
            ? currentAction.label.replace(
                String(currentValue),
                String(resolvedValue)
            )
            : currentAction.label;

    const resolvedAction: WorkflowAction =
        parameter === 'target'
            ? {
                ...currentAction,
                label: resolvedLabel,
                target:
                    resolvedValue as WorkflowAction['target'],
                parameters: {
                    ...currentAction.parameters,
                    ...(
                        'target' in currentAction.parameters
                            ? { target: resolvedValue }
                            : {}
                    )
                }
            }
            : {
                ...currentAction,
                label: resolvedLabel,
                parameters: {
                    ...currentAction.parameters,
                    [parameter]: resolvedValue
                }
            };

    const remainingChanges =
        step.resolutionChanges.filter(
            change =>
                change.parameter !== parameter
        );

    /*
     * Returning a parameter to its original value removes
     * that resolution from provenance.
     */
    if (Object.is(resolvedValue, originalValue)) {
        const revertedLabel =
            currentValue !== undefined &&
                currentValue !== null
                ? currentAction.label.replace(
                    String(currentValue),
                    String(originalValue)
                )
                : currentAction.label;

        const revertedAction: WorkflowAction =
            parameter === 'target'
                ? {
                    ...currentAction,
                    label: revertedLabel,
                    target:
                        originalValue as WorkflowAction['target'],
                    parameters: {
                        ...currentAction.parameters,
                        ...(
                            'target' in currentAction.parameters
                                ? { target: originalValue }
                                : {}
                        )
                    }
                }
                : {
                    ...currentAction,
                    label: revertedLabel,
                    parameters: {
                        ...currentAction.parameters,
                        [parameter]: originalValue
                    }
                };

        return {
            ...step,
            resolvedAction:
                remainingChanges.length > 0
                    ? revertedAction
                    : undefined,
            resolutionChanges: remainingChanges
        };
    }

    const nextChange = {
        parameter,
        originalValue,
        resolvedValue
    };

    return {
        ...step,
        resolvedAction,
        resolutionChanges: [
            ...remainingChanges,
            nextChange
        ]
    };
};

const getRuntimeFilterDescriptorsForAction = (
    action: WorkflowAction
): SimulatedFilterDescriptor[] => {
    if (action.type === 'variance_filter') {
        return [
            {
                axis: 'row',
                type: 'variance',
                top_n: action.parameters.topN as number
            }
        ];
    }

    if (action.type === 'zscore') {
        return [
            {
                axis:
                    action.parameters.axis === 'row'
                        ? 'row'
                        : 'col',
                type: 'zscore'
            }
        ];
    }

    if (action.type === 'filter') {
        const criteria = action.parameters.criteria;

        if (Array.isArray(criteria)) {
            return criteria.map(criterion => {
                const item =
                    criterion as Record<string, unknown>;

                return {
                    axis: 'col' as const,
                    type: 'sample_filter',
                    field: item.field as string,
                    value: item.value
                };
            });
        }

        return [
            {
                axis:
                    action.target === 'rows'
                        ? 'row'
                        : 'col',
                type:
                    action.target === 'rows'
                        ? 'gene_filter'
                        : 'sample_filter',
                field: action.parameters.field as string,
                value: action.parameters.value
            }
        ];
    }

    if (action.type === 'inverse_filter') {
        const criteria = action.parameters.criteria;

        if (Array.isArray(criteria)) {
            return [
                {
                    axis: 'col',
                    type: 'multi_exclude',
                    criteria: criteria.map(criterion => {
                        const item =
                            criterion as Record<string, unknown>;

                        return {
                            field: item.field as string,
                            value: item.value
                        };
                    })
                }
            ];
        }

        return [
            {
                axis: 'col',
                type: 'exclude_filter',
                field: action.parameters.field as string,
                value: action.parameters.value
            }
        ];
    }

    return [];
};

interface SimulatedInvalidatedFilter {
    descriptor: SimulatedFilterDescriptor;
    invalidatedByActionId: string;
}

interface SimulatedFilterState {
    row: SimulatedFilterDescriptor[];
    col: SimulatedFilterDescriptor[];
    lastClearActionId?: string;
    invalidatedFilters: SimulatedInvalidatedFilter[];
}

const applyFilterDescriptorToSimulatedState = (
    state: SimulatedFilterState,
    descriptor: SimulatedFilterDescriptor
): SimulatedFilterState => {
    const nextState: SimulatedFilterState = {
        row: [...state.row],
        col: [...state.col],
        lastClearActionId: state.lastClearActionId,
        invalidatedFilters: [...state.invalidatedFilters]
    };

    const filtersForAxis = nextState[descriptor.axis];

    const existingIndex = filtersForAxis.findIndex(
        existing => {
            if (
                descriptor.type === 'variance' ||
                descriptor.type === 'zscore'
            ) {
                return existing.type === descriptor.type;
            }

            if (
                descriptor.type === 'sample_filter' ||
                descriptor.type === 'gene_filter' ||
                descriptor.type === 'exclude_filter'
            ) {
                return (
                    existing.type === descriptor.type &&
                    existing.field === descriptor.field
                );
            }

            return false;
        }
    );

    if (existingIndex >= 0) {
        const existingDescriptor =
            filtersForAxis[existingIndex];

        if (descriptor.sourceActionId) {
            nextState.invalidatedFilters.push({
                descriptor: existingDescriptor,
                invalidatedByActionId:
                    descriptor.sourceActionId
            });
        }

        filtersForAxis[existingIndex] =
            descriptor;
    } else {
        filtersForAxis.push(descriptor);
    }

    return nextState;
};

const applyWorkflowActionToSimulatedFilterState = (
    state: SimulatedFilterState,
    action: WorkflowAction
): SimulatedFilterState => {
    if (action.type === 'clear_filters') {
        const invalidatedByClear = [
            ...state.row,
            ...state.col
        ].map(descriptor => ({
            descriptor,
            invalidatedByActionId: action.id
        }));

        return {
            row: [],
            col: [],
            lastClearActionId: action.id,
            invalidatedFilters: [
                ...state.invalidatedFilters,
                ...invalidatedByClear
            ]
        };
    }

    const descriptors =
        getRuntimeFilterDescriptorsForAction(action);

    return descriptors.reduce(
        (nextState, descriptor) =>
            applyFilterDescriptorToSimulatedState(
                nextState,
                {
                    ...descriptor,
                    sourceActionId: action.id
                }
            ),
        state
    );
};

const simulatedFilterDescriptorsEqual = (
    left: SimulatedFilterDescriptor,
    right: SimulatedFilterDescriptor
): boolean => {
    if (
        left.axis !== right.axis ||
        left.type !== right.type
    ) {
        return false;
    }

    if (
        left.type === 'sample_filter' ||
        left.type === 'gene_filter' ||
        left.type === 'exclude_filter'
    ) {
        return (
            left.field === right.field &&
            left.value === right.value
        );
    }

    if (
        left.type === 'variance' ||
        left.type === 'expression'
    ) {
        return left.top_n === right.top_n;
    }

    if (left.type === 'pvalue') {
        return left.value === right.value;
    }

    if (left.type === 'zscore') {
        return true;
    }

    if (left.type === 'multi_exclude') {
        return (
            JSON.stringify(left.criteria ?? []) ===
            JSON.stringify(right.criteria ?? [])
        );
    }

    return (
        left.field === right.field &&
        left.value === right.value &&
        left.top_n === right.top_n &&
        JSON.stringify(left.criteria ?? []) ===
        JSON.stringify(right.criteria ?? [])
    );
};

const simulatedFilterStatesEqual = (
    left: SimulatedFilterState,
    right: SimulatedFilterState
): boolean => {
    const axisMatches = (
        axis: 'row' | 'col'
    ): boolean => {
        if (left[axis].length !== right[axis].length) {
            return false;
        }

        return left[axis].every(
            (descriptor, index) =>
                simulatedFilterDescriptorsEqual(
                    descriptor,
                    right[axis][index]
                )
        );
    };

    return (
        axisMatches('row') &&
        axisMatches('col')
    );
};

const removeFilterDescriptorFromSimulatedState = (
    state: SimulatedFilterState,
    descriptor: SimulatedFilterDescriptor
): {
    state: SimulatedFilterState;
    removed: boolean;
    matchedDescriptor?: SimulatedFilterDescriptor;
} => {
    const filtersForAxis = state[descriptor.axis];

    const matchingIndex = filtersForAxis.findIndex(
        existing =>
            simulatedFilterDescriptorsEqual(
                existing,
                descriptor
            )
    );

    if (matchingIndex < 0) {
        return {
            state,
            removed: false
        };
    }

    const matchedDescriptor =
        filtersForAxis[matchingIndex];

    const nextState: SimulatedFilterState = {
        row: [...state.row],
        col: [...state.col],
        lastClearActionId: state.lastClearActionId,
        invalidatedFilters: [...state.invalidatedFilters]
    };

    nextState[descriptor.axis].splice(
        matchingIndex,
        1
    );

    return {
        state: nextState,
        removed: true,
        matchedDescriptor
    };
};

const findMostRecentInvalidatingActionId = (
    state: SimulatedFilterState,
    descriptor: SimulatedFilterDescriptor
): string | undefined => {
    for (
        let index =
            state.invalidatedFilters.length - 1;
        index >= 0;
        index--
    ) {
        const invalidated =
            state.invalidatedFilters[index];

        if (
            simulatedFilterDescriptorsEqual(
                invalidated.descriptor,
                descriptor
            )
        ) {
            return invalidated.invalidatedByActionId;
        }
    }

    return undefined;
};

const applyRemoveFiltersToSimulatedState = (
    state: SimulatedFilterState,
    action: WorkflowAction
): {
    state: SimulatedFilterState;
    missingDescriptor?: SimulatedFilterDescriptor;
    invalidatedByActionId?: string;
} => {
    if (action.type !== 'remove_filters') {
        return { state };
    }

    const filters = action.parameters.filters;

    if (!Array.isArray(filters)) {
        return { state };
    }

    let nextState = state;

    for (const filter of filters) {
        const item =
            filter as Record<string, unknown>;

        const descriptor: SimulatedFilterDescriptor = {
            axis: item.axis as 'row' | 'col',
            type: item.type as string,
            field:
                typeof item.field === 'string'
                    ? item.field
                    : undefined,
            value: item.value,
            top_n:
                typeof item.top_n === 'number'
                    ? item.top_n
                    : undefined,
            criteria:
                Array.isArray(item.criteria)
                    ? item.criteria.map(criterion => {
                        const criterionItem =
                            criterion as Record<string, unknown>;

                        return {
                            field: criterionItem.field as string,
                            value: criterionItem.value
                        };
                    })
                    : undefined
        };

        const result =
            removeFilterDescriptorFromSimulatedState(
                nextState,
                descriptor
            );

        if (!result.removed) {
            return {
                state: nextState,
                missingDescriptor: descriptor,
                invalidatedByActionId:
                    findMostRecentInvalidatingActionId(
                        nextState,
                        descriptor
                    )
            };
        }

        nextState = result.state;

        if (result.matchedDescriptor) {
            nextState.invalidatedFilters.push({
                descriptor: result.matchedDescriptor,
                invalidatedByActionId: action.id
            });
        }
    }

    return {
        state: nextState
    };
};

export const validateImportedWorkflowStepsSequentially = (
    steps: ImportedWorkflowStep[],
    context: WorkflowDatasetContext
): ImportedWorkflowStep[] => {
    let simulatedState: SimulatedFilterState = {
        row: [],
        col: [],
        invalidatedFilters: []
    };

    let originalSimulatedState: SimulatedFilterState = {
        row: [],
        col: [],
        invalidatedFilters: []
    };

    let activeCropActionId: string | undefined;
    let lastCropInvalidatingActionId: string | undefined;

    return steps.map(step => {
        const expectedFilterStateBeforeAction =
            originalSimulatedState;

        const originalAction =
            step.originalAction;

        if (originalAction.type === 'remove_filters') {
            const originalRemovalResult =
                applyRemoveFiltersToSimulatedState(
                    originalSimulatedState,
                    originalAction
                );

            if (!originalRemovalResult.missingDescriptor) {
                originalSimulatedState =
                    originalRemovalResult.state;
            }
        } else {
            originalSimulatedState =
                applyWorkflowActionToSimulatedFilterState(
                    originalSimulatedState,
                    originalAction
                );
        }

        const action =
            getEffectiveWorkflowAction(step);

        const staticValidation =
            validateWorkflowActionAgainstDataset(
                action,
                context
            );

        /*
         * Excluded steps remain visible and statically validated,
         * but they do not affect simulated execution state.
         */
        if (!step.included) {
            return {
                ...step,
                validation: staticValidation
            };
        }

        /*
         * Invalid included steps cannot safely advance the
         * simulated workflow state.
         */
        if (staticValidation.status !== 'ready') {
            return {
                ...step,
                validation: staticValidation
            };
        }

        if (
            action.type === 'crop' &&
            action.parameters.requiresCompatibleOrdering === true &&
            !simulatedFilterStatesEqual(
                simulatedState,
                expectedFilterStateBeforeAction
            )
        ) {
            return {
                ...step,
                validation: {
                    status: 'blocked',
                    issues: [
                        {
                            code: 'DEPENDENCY_FAILED',
                            message:
                                'This crop cannot be replayed because the active filter state differs from the state present when the crop was recorded.',
                            parameter: 'requiresCompatibleOrdering'
                        }
                    ]
                }
            };
        }

        if (action.type === 'clear_crop') {
            if (!activeCropActionId) {
                return {
                    ...step,
                    validation: {
                        status: 'blocked',
                        issues: [
                            {
                                code: 'DEPENDENCY_FAILED',
                                message:
                                    'Cannot clear crop because no crop is active at this point in the workflow.',
                                dependsOnActionId:
                                    lastCropInvalidatingActionId
                            }
                        ]
                    }
                };
            }

            activeCropActionId = undefined;
            lastCropInvalidatingActionId = action.id;

            return {
                ...step,
                validation: staticValidation
            };
        }

        if (action.type === 'crop') {
            activeCropActionId = action.id;
            lastCropInvalidatingActionId = undefined;
        }

        if (action.type === 'remove_filters') {
            const result =
                applyRemoveFiltersToSimulatedState(
                    simulatedState,
                    action
                );

            if (result.missingDescriptor) {
                const missing =
                    result.missingDescriptor;

                return {
                    ...step,
                    validation: {
                        status: 'blocked',
                        issues: [
                            {
                                code: 'DEPENDENCY_FAILED',
                                message:
                                    `Cannot remove filter "${missing.type}" because the matching filter is not active at this point in the workflow.`,
                                parameter: 'filters',
                                dependsOnActionId:
                                    result.invalidatedByActionId
                            }
                        ]
                    }
                };
            }

            simulatedState = result.state;

            return {
                ...step,
                validation: staticValidation
            };
        }

        simulatedState =
            applyWorkflowActionToSimulatedFilterState(
                simulatedState,
                action
            );

        return {
            ...step,
            validation: staticValidation
        };
    });
};

export const buildWorkflowPreflightResult = (
    steps: ImportedWorkflowStep[],
    context: WorkflowDatasetContext,
    recipeIssues: WorkflowIssue[] = []
): WorkflowPreflightResult => {
    const validatedSteps =
        validateImportedWorkflowStepsSequentially(
            steps,
            context
        );

    const includedSteps =
        validatedSteps.filter(
            step => step.included
        ).length;

    const excludedSteps =
        validatedSteps.length - includedSteps;

    const modifiedSteps =
        validatedSteps.filter(
            step =>
                step.resolvedAction !== undefined ||
                step.resolutionChanges.length > 0
        ).length;

    const unresolvedSteps =
        validatedSteps.filter(
            step =>
                step.included &&
                (
                    step.validation.status === 'needs_resolution' ||
                    step.validation.status === 'blocked'
                )
        ).length;

    return {
        steps: validatedSteps,
        recipeIssues,
        canRun:
            recipeIssues.length === 0 &&
            includedSteps > 0 &&
            unresolvedSteps === 0,
        totalSteps: validatedSteps.length,
        includedSteps,
        excludedSteps,
        modifiedSteps,
        unresolvedSteps
    };
};


