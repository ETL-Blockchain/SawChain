'use strict';

const {
    SystemAdmin,
    TaskType,
    ProductType,
    EventParameterType,
    EventType,
    PropertyType,
    TypeData
} = require('../services/proto');
const {
    reject
} = require('../services/utils');
const {
    getTaskTypeAddress,
    getSystemAdminAddress,
    getProductTypeAddress,
    getEventParameterTypeAddress,
    getEventTypeAddress,
    getPropertyTypeAddress
} = require('../services/addressing');

/**
 * Handle a Task Type transaction action.
 * @param {Context} context Current state context.
 * @param {String} signerPublicKey The System Admin public key.
 * @param {Object} timestamp Date and time when transaction is sent.
 * @param {String} id Task Type unique identifier.
 * @param {String} role A string describing a task/role bindable to Operators.
 */
async function createTaskType(
    context,
    signerPublicKey,
    timestamp,
    {id, role}
) {
    // Validation: Id is not set.
    if (!id)
        reject(`Id is not set!`);

    // Validation: Role is not set.
    if (!role)
        reject(`Role is not set!`);

    const systemAdminAddress = getSystemAdminAddress();
    const taskTypeAddress = getTaskTypeAddress(id);

    const state = await context.getState([
        systemAdminAddress,
        taskTypeAddress
    ]);

    const adminState = SystemAdmin.decode(state[systemAdminAddress]);

    // Validation: Transaction signer is not the System Admin.
    if (adminState.publicKey !== signerPublicKey)
        reject(`You must be the System Admin to create a Task Type!`);

    // Validation: There is a Task Type already associated to given id.
    if (state[taskTypeAddress].length > 0)
        reject(`There is a Task Type already associated to given id: ${id}!`);

    // State update.
    const updates = {};

    updates[getTaskTypeAddress(id)] = TaskType.encode({
        id: id,
        role: role
    }).finish();

    await context.setState(updates)
}

/**
 * Handle a Product Type transaction action.
 * @param {Context} context Current state context.
 * @param {String} signerPublicKey The System Admin public key.
 * @param {Object} timestamp Date and time when transaction is sent.
 * @param {String} id Product Type unique identifier.
 * @param {String} name Product name.
 * @param {String} description Product description.
 * @param {Number} measure Product unit of measure from enumeration of possible values.
 * @param {Object[]} derivedProducts List of identifiers and conversion rate for derived product types.
 */
async function createProductType(
    context,
    signerPublicKey,
    timestamp,
    {id, name, description, measure, derivedProducts}
) {
    // Validation: Id is not set.
    if (!id)
        reject(`Id is not set!`);

    // Validation: Name is not set.
    if (!name)
        reject(`Name is not set!`);

    // Validation: Description is not set.
    if (!description)
        reject(`Description is not set!`);

    // Validation: Provided value for measure doesn't match the types specified in the ProductType's UnitOfMeasure.
    if (!Object.values(TypeData.UnitOfMeasure).some((value) => value === measure))
        reject(`Provided value for measure doesn't match any possible value!`);

    const systemAdminAddress = getSystemAdminAddress();
    const productTypeAddress = getProductTypeAddress(id);

    const state = await context.getState([
        systemAdminAddress,
        productTypeAddress
    ]);

    const adminState = SystemAdmin.decode(state[systemAdminAddress]);

    // Validation: Transaction signer is not the System Admin.
    if (adminState.publicKey !== signerPublicKey)
        reject(`Transaction signer is not the System Admin!`);

    // Validation: There is a Product Type already associated to given id.
    if (state[productTypeAddress].length > 0)
        reject(`There is a Product Type already associated to given id!`);

    // Validation: At least one of the provided values for derivedProducts doesn't match a valid Product Type.
    for (const derivedProduct of derivedProducts) {
        let derivedProductTypeAddress = getProductTypeAddress(derivedProduct.derivedProductType);

        let derivedProductState = await context.getState([
            derivedProductTypeAddress
        ]);

        if (!derivedProductState[derivedProductTypeAddress].length) {
            reject(`The provided Product Type ${id} doesn't match a valid Product Type!`);
        }

        // Validation: At least one of the provided values for derivedProducts doesn't have a conversionRate greater than 0
        if (!derivedProduct.conversionRate > 0) {
            reject(`The provided conversion rate for ${id} is lower than 0!`);
        }
    }

    // State update.
    const updates = {};

    updates[getProductTypeAddress(id)] = ProductType.encode({
        id: id,
        name: name,
        description: description,
        measure: measure,
        derivedProducts: derivedProducts
    }).finish();

    await context.setState(updates)
}

/**
 * Handle a Event Parameter Type transaction action.
 * @param {Context} context Current state context.
 * @param {String} signerPublicKey The System Admin public key.
 * @param {Object} timestamp Date and time when transaction is sent.
 * @param {String} id Event Parameter Type unique identifier.
 * @param {String} name Event Parameter name.
 * @param {Number} type Event Parameter type from enumeration of possible values.
 */
async function createEventParameterType(
    context,
    signerPublicKey,
    timestamp,
    {id, name, type}
) {
    // Validation: Id is not set.
    if (!id)
        reject(`Id is not set!`);

    // Validation: Name is not set.
    if (!name)
        reject(`Name is not set!`);

    // Validation: Provided value for type doesn't match the types specified in the EventParameter's EventParameterType.
    if (!Object.values(TypeData.Type).some((value) => value === type))
        reject(`Provided value for type doesn't match any possible value!`);

    const systemAdminAddress = getSystemAdminAddress();
    const eventParameterTypeAddress = getEventParameterTypeAddress(id);

    const state = await context.getState([
        systemAdminAddress,
        eventParameterTypeAddress
    ]);

    const adminState = SystemAdmin.decode(state[systemAdminAddress]);

    // Validation: Transaction signer is not the System Admin.
    if (adminState.publicKey !== signerPublicKey)
        reject(`Transaction signer is not the System Admin!`);

    // Validation: There is an Event Parameter Type already associated to given id.
    if (state[eventParameterTypeAddress].length > 0)
        reject(`There is an Event Parameter Type already associated to given id!`);

    // State update.
    const updates = {};

    updates[eventParameterTypeAddress] = EventParameterType.encode({
        id: id,
        name: name,
        type: type
    }).finish();

    await context.setState(updates)
}

/**
 * Handle a Event Type transaction action.
 * @param {Context} context Current state context.
 * @param {String} signerPublicKey The System Admin public key.
 * @param {Object} timestamp Date and time when transaction is sent.
 * @param {String} id Event Type unique identifier.
 * @param {Number} typology Event Type typology from enumeration of possible values.
 * @param {String} name Event name.
 * @param {String} description Event description.
 * @param {String[]} parameters List of identifiers of Event Parameter Types that customize the Event Type data.
 * @param {String[]} enabledTaskTypes List of identifiers of Task Types which Operators must have to record the Event Type.
 * @param {String[]} enabledProductTypes List of identifiers of Product Types where the Event Type can be recorded.
 * @param {String[]} derivedProductTypes List of identifiers of derived Product Types.
 */
async function createEventType(
    context,
    signerPublicKey,
    timestamp,
    {
        id,
        typology,
        name,
        description,
        parameters,
        enabledTaskTypes,
        enabledProductTypes,
        derivedProductTypes
    }
) {
    // Validation: Id is not set.
    if (!id)
        reject(`Id is not set!`);

    // Validation: Provided value for typology doesn't match the types specified in the EventType's EventTypology.
    if (!Object.values(EventType.EventTypology).some((value) => value === typology))
        reject(`Provided value for typology doesn't match any possible value!`);

    // Validation: Name is not set.
    if (!name)
        reject(`Name is not set!`);

    // Validation: Description is not set.
    if (!description)
        reject(`Description is not set!`);

    // Validation: Enabled task types list is not set.
    if (!enabledTaskTypes.length)
        reject(`Enabled task types list is not set!`);

    // Validation: Enabled product types list is not set.
    if (!enabledProductTypes.length)
        reject(`Enabled product types list is not set!`);

    const systemAdminAddress = getSystemAdminAddress();
    const eventTypeAddress = getEventTypeAddress(id);

    const state = await context.getState([
        systemAdminAddress,
        eventTypeAddress
    ]);

    const adminState = SystemAdmin.decode(state[systemAdminAddress]);

    // Validation: Transaction signer is not the System Admin.
    if (adminState.publicKey !== signerPublicKey)
        reject(`Transaction signer is not the System Admin!`);

    // Validation: There is a Event Type already associated to given id.
    if (state[eventTypeAddress].length > 0)
        reject(`There is an Event Type already associated to given id!`);

    // Validation: At least one of the provided Event Parameter Types values for parameters doesn't match a valid Event Parameter Type.
    for (const parameter of parameters) {
        let parameterTypeAddress = getEventParameterTypeAddress(parameter.parameterTypeId);

        let parameterTypeState = await context.getState([
            parameterTypeAddress
        ]);

        if (!parameterTypeState[parameterTypeAddress].length) {
            reject(`The provided Event Parameter Type ${parameter.parameterTypeId} doesn't match a valid Event Parameter Type!`);
        }
    }

    // Validation: At least one of the provided Task Types values for enable task types doesn't match a valid Task Type.
    for (const taskTypeId of enabledTaskTypes) {
        let taskTypeAddress = getTaskTypeAddress(taskTypeId);

        let taskTypeState = await context.getState([
            taskTypeAddress
        ]);

        if (!taskTypeState[taskTypeAddress].length) {
            reject(`The provided Task Type ${taskTypeId} doesn't match a valid Task Type!`);
        }
    }

    // Validation: At least one of the provided Product Types values for enable product types doesn't match a valid Product Type.
    for (const productTypeId of enabledProductTypes) {
        let productTypeAddress = getProductTypeAddress(productTypeId);

        let productTypeState = await context.getState([
            productTypeAddress
        ]);

        if (!productTypeState[productTypeAddress].length) {
            reject(`The provided Product Type ${productTypeId} doesn't match a valid Product Type!`);
        }
    }

    // Validation: No derived products for transformation event typology.
    if (typology === EventType.EventTypology.TRANSFORMATION && !derivedProductTypes.length)
        reject(`No derived products for transformation event typology!`);

    // Validation: Derived products are given for description event.
    if (typology !== EventType.EventTypology.TRANSFORMATION && derivedProductTypes.length > 0)
        reject(`Derived products are given for description event!`);

    // Validation: At least one of the provided Product Types values for derived product types doesn't match a valid Product Type.
    for (const productTypeId of derivedProductTypes) {
        const productTypeAddress = getProductTypeAddress(productTypeId);

        let state = await context.getState([
            productTypeAddress
        ]);

        if (!state[productTypeAddress].length) {
            reject(`The provided Product Type ${productTypeId} doesn't match a valid Product Type!`);
        }

        // Validation: At least one of the provided Product Types values for derived product types doesn't match with one of those enabled for the Product Type.
        for (const enableProductType of enabledProductTypes) {
            let productTypeAddress = getProductTypeAddress(enableProductType);

            let state = await context.getState([
                productTypeAddress
            ]);

            const productTypeState = ProductType.decode(state[productTypeAddress]);

            if (!productTypeState.derivedProducts.some(drvPrdTp => drvPrdTp.derivedProductType === productTypeId))
                reject(`The provided derived Product Type ${productTypeId} doesn't match with one of those enabled for the Product Type!`);
        }
    }

    // State update.
    const updates = {};

    updates[eventTypeAddress] = EventType.encode({
        id: id,
        typology: typology,
        name: name,
        description: description,
        parameters: parameters,
        enabledTaskTypes: enabledTaskTypes,
        enabledProductTypes: enabledProductTypes,
        derivedProductTypes: derivedProductTypes
    }).finish();

    await context.setState(updates)
}

/**
 * Handle a Property Type transaction action.
 * @param {Context} context Current state context.
 * @param {String} signerPublicKey The System Admin public key.
 * @param {Object} timestamp Date and time when transaction is sent.
 * @param {String} id Property Type unique identifier.
 * @param {String} name Property name.
 * @param {Number} type Property type from enumeration of possible values.
 * @param {String[]} enabledTaskTypes List of identifiers of Task Types which Operators must have to record the Property Type.
 * @param {String[]} enabledProductTypes List of identifiers of Product Types where the Property Type can be recorded.
 */
async function createPropertyType(
    context,
    signerPublicKey,
    timestamp,
    {
        id,
        name,
        type,
        enabledTaskTypes,
        enabledProductTypes
    }
) {
    // Validation: Id is not set.
    if (!id)
        reject(`Id is not set!`);

    // Validation: Name is not set.
    if (!name)
        reject(`Name is not set!`);

    // Validation: Provided value for type doesn't match the types specified in the PropertyType's Type.
    if (!Object.values(TypeData.Type).some((value) => value === type))
        reject(`Provided value for type doesn't match any possible value!`);

    // Validation: Enabled task types list is not set.
    if (!enabledTaskTypes.length)
        reject(`Enabled task types list is not set!`);

    // Validation: Enabled product types list is not set.
    if (!enabledProductTypes.length)
        reject(`Enabled product types list is not set!`);

    const systemAdminAddress = getSystemAdminAddress();
    const propertyTypeAddress = getPropertyTypeAddress(id);

    const state = await context.getState([
        systemAdminAddress,
        propertyTypeAddress
    ]);

    const adminState = SystemAdmin.decode(state[systemAdminAddress]);

    // Validation: Transaction signer is not the System Admin.
    if (adminState.publicKey !== signerPublicKey)
        reject(`Transaction signer is not the System Admin!`);

    // Validation: There is a Property Type already associated to given id.
    if (state[propertyTypeAddress].length > 0)
        reject(`There is an Property Type already associated to given id!`);

    // Validation: At least one of the provided Task Types values for enable task types doesn't match a valid Task Type.
    for (const taskTypeId of enabledTaskTypes) {
        let taskTypeAddress = getTaskTypeAddress(taskTypeId);

        let taskTypeState = await context.getState([
            taskTypeAddress
        ]);

        if (!taskTypeState[taskTypeAddress].length) {
            reject(`The provided Task Type ${taskTypeId} doesn't match a valid Task Type!`);
        }
    }

    // Validation: At least one of the provided Product Types values for enable product types doesn't match a valid Product Type.
    for (const productTypeId of enabledProductTypes) {
        let productTypeAddress = getProductTypeAddress(productTypeId);

        let productTypeState = await context.getState([
            productTypeAddress
        ]);

        if (!productTypeState[productTypeAddress].length) {
            reject(`The provided Product Type ${productTypeId} doesn't match a valid Product Type!`);
        }
    }

    // State update.
    const updates = {};

    updates[propertyTypeAddress] = PropertyType.encode({
        id: id,
        name: name,
        type: type,
        enabledTaskTypes: enabledTaskTypes,
        enabledProductTypes: enabledProductTypes
    }).finish();

    await context.setState(updates)
}

module.exports = {
    createTaskType,
    createProductType,
    createEventParameterType,
    createEventType,
    createPropertyType
};