import {interfaces} from 'inversify';

/**
 * An functional extension used for extending a container behavior.
 */
export interface ExtensionRunner
{
    priority?: number;

    (container: interfaces.Container): void;
}

/**
 * A complete extension instance.
 */
export interface ExtensionInstance
{
    priority?: number;

    extend(container: interfaces.Container): void;
}

/** 
 * A default priority for extension that must be executed in the first place
 */
export const PRIORITY_HIGH = -255;

/**
 * A default priority for extension that be executed in a middle position. This
 * is the default priority value.
 */
export const PRIORITY_NORMAL = 0;

/**
 * A default priority for extensions that must be executed at the end
 */
export const PRIORITY_LOW = 255;

/**
 * A generic type for extension
 */
export type Extension = ExtensionRunner|ExtensionInstance;
