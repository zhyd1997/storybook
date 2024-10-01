import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import { existsSync, lstatSync } from 'node:fs';
import * as fsp from 'node:fs/promises';
import { mkdir, rm, stat } from 'node:fs/promises';
import * as fsPath from 'node:path';

import * as R from 'ramda';

const pathExists = async (path: string) => {
  return stat(path)
    .then(() => true)
    .catch(() => false);
};

async function ensureDir(dirPath: string): Promise<void> {
  try {
    // Attempt to create the directory recursively
    await mkdir(dirPath, { recursive: true });
  } catch (err: any) {
    // If the error is something other than the directory already existing, throw the error
    if (err.code !== 'EEXIST') {
      throw err;
    }
  }
}

async function remove(path: string): Promise<void> {
  try {
    // Attempt to remove the file or directory recursively
    await rm(path, { recursive: true, force: true });
  } catch (err: any) {
    // If the error code is anything other than the path not existing, rethrow the error
    if (err.code !== 'ENOENT') {
      throw err;
    }
  }
}

export type FileSystemCacheOptions = {
  basePath?: string;
  ns?: any;
  ttl?: number;
  hash?: HashAlgorithm;
  extension?: string;
};

export const isNothing = (value: any) => R.isNil(value) || R.isEmpty(value);
export const isString = R.is(String);

export const toAbsolutePath = (path: string) => {
  return path.startsWith('.') ? fsPath.resolve(path) : path;
};

export const ensureString = (defaultValue: string, text?: string): string => {
  return typeof text === 'string' ? text : defaultValue;
};

export const compact = (input: any[]): string[] => {
  const flat = [].concat(...input);
  return flat.filter((value) => !R.isNil(value));
};

export const toStringArray = R.pipe(compact, R.map(R.toString));

export const isFileSync = (path: string) => {
  return existsSync(path) ? lstatSync(path).isFile() : false;
};

export const readFileSync = (path: string) => {
  return existsSync(path) ? fs.readFileSync(path).toString() : undefined;
};

export const filePathsP = async (basePath: string, ns: string): Promise<string[]> => {
  if (!(await pathExists(basePath))) {
    return [];
  }
  return (await fsp.readdir(basePath))
    .filter(Boolean)
    .filter((name) => (ns ? name.startsWith(ns) : true))
    .filter((name) => (!ns ? !name.includes('-') : true))
    .map((name) => `${basePath}/${name}`);
};

/**
 * Turns a set of values into a HEX hash code.
 *
 * @param values: The set of values to hash.
 */
export const hash = (algorithm: HashAlgorithm, ...values: any[]) => {
  if (R.pipe(compact, R.isEmpty)(values)) {
    return undefined;
  }
  const resultHash = crypto.createHash(algorithm);
  const addValue = (value: any) => resultHash.update(value);
  const addValues = R.forEach(addValue);
  R.pipe(toStringArray, addValues)(values);
  return resultHash.digest('hex');
};

export const hashExists = (algorithm: HashAlgorithm) => {
  return crypto.getHashes().includes(algorithm);
};

/** Retrieve a value from the given path. */
export async function getValueP(path: string, defaultValue?: any) {
  const exists = await pathExists(path);

  if (!exists) {
    return defaultValue;
  }
  try {
    const content = await fsp.readFile(path, 'utf8');
    return toGetValue(JSON.parse(content));
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return defaultValue;
    }
    if (error.message === 'Cache item has expired.') {
      fs.rmSync(path);
      return defaultValue;
    }
    throw new Error(`Failed to read cache value at: ${path}. ${error.message}`);
  }
}

/** Format value structure. */
export const toGetValue = (data: any) => {
  if (isExpired(data)) {
    return undefined;
  }

  if (data.type === 'Date') {
    return new Date(data.value);
  }
  return data.value;
};

/** Stringify a value into JSON. */
export const toJson = (value: any, ttl: number) =>
  JSON.stringify({ value, type: R.type(value), created: new Date(), ttl });

/** Check's a cache item to see if it has expired. */
export const isExpired = (data: any) => {
  const timeElapsed = (new Date().getTime() - new Date(data.created).getTime()) / 1000;
  return timeElapsed > data.ttl && data.ttl > 0;
};

export type HashAlgorithm =
  | 'RSA-MD5'
  | 'RSA-RIPEMD160'
  | 'RSA-SHA1'
  | 'RSA-SHA1-2'
  | 'RSA-SHA224'
  | 'RSA-SHA256'
  | 'RSA-SHA3-224'
  | 'RSA-SHA3-256'
  | 'RSA-SHA3-384'
  | 'RSA-SHA3-512'
  | 'RSA-SHA384'
  | 'RSA-SHA512'
  | 'RSA-SHA512/224'
  | 'RSA-SHA512/256'
  | 'RSA-SM3'
  | 'blake2b512'
  | 'blake2s256'
  | 'id-rsassa-pkcs1-v1_5-with-sha3-224'
  | 'id-rsassa-pkcs1-v1_5-with-sha3-256'
  | 'id-rsassa-pkcs1-v1_5-with-sha3-384'
  | 'id-rsassa-pkcs1-v1_5-with-sha3-512'
  | 'md5'
  | 'md5-sha1'
  | 'md5WithRSAEncryption'
  | 'ripemd'
  | 'ripemd160'
  | 'ripemd160WithRSA'
  | 'rmd160'
  | 'sha1'
  | 'sha1WithRSAEncryption'
  | 'sha224'
  | 'sha224WithRSAEncryption'
  | 'sha256'
  | 'sha256WithRSAEncryption'
  | 'sha3-224'
  | 'sha3-256'
  | 'sha3-384'
  | 'sha3-512'
  | 'sha384'
  | 'sha384WithRSAEncryption'
  | 'sha512'
  | 'sha512-224'
  | 'sha512-224WithRSAEncryption'
  | 'sha512-256'
  | 'sha512-256WithRSAEncryption'
  | 'sha512WithRSAEncryption'
  | 'shake128'
  | 'shake256'
  | 'sm3'
  | 'sm3WithRSAEncryption'
  | 'ssl3-md5'
  | 'ssl3-sha1';

export const hashAlgorithms: HashAlgorithm[] = [
  'RSA-MD5',
  'RSA-RIPEMD160',
  'RSA-SHA1',
  'RSA-SHA1-2',
  'RSA-SHA224',
  'RSA-SHA256',
  'RSA-SHA3-224',
  'RSA-SHA3-256',
  'RSA-SHA3-384',
  'RSA-SHA3-512',
  'RSA-SHA384',
  'RSA-SHA512',
  'RSA-SHA512/224',
  'RSA-SHA512/256',
  'RSA-SM3',
  'blake2b512',
  'blake2s256',
  'id-rsassa-pkcs1-v1_5-with-sha3-224',
  'id-rsassa-pkcs1-v1_5-with-sha3-256',
  'id-rsassa-pkcs1-v1_5-with-sha3-384',
  'id-rsassa-pkcs1-v1_5-with-sha3-512',
  'md5',
  'md5-sha1',
  'md5WithRSAEncryption',
  'ripemd',
  'ripemd160',
  'ripemd160WithRSA',
  'rmd160',
  'sha1',
  'sha1WithRSAEncryption',
  'sha224',
  'sha224WithRSAEncryption',
  'sha256',
  'sha256WithRSAEncryption',
  'sha3-224',
  'sha3-256',
  'sha3-384',
  'sha3-512',
  'sha384',
  'sha384WithRSAEncryption',
  'sha512',
  'sha512-224',
  'sha512-224WithRSAEncryption',
  'sha512-256',
  'sha512-256WithRSAEncryption',
  'sha512WithRSAEncryption',
  'shake128',
  'shake256',
  'sm3',
  'sm3WithRSAEncryption',
  'ssl3-md5',
  'ssl3-sha1',
];
/** A cache that read/writes to a specific part of the file-system. */
export class FileSystemCache {
  /** The list of all available hash algorithms. */
  static hashAlgorithms: HashAlgorithm[] = hashAlgorithms;

  /** Instance. */
  readonly basePath: string;

  readonly ns?: any;

  readonly extension?: string;

  readonly hash: HashAlgorithm;

  readonly ttl: number;

  basePathExists?: boolean;

  /**
   * Constructor.
   *
   * @param options - BasePath: The folder path to read/write to. Default: './build' - ns: A single
   *   value, or array, that represents a a unique namespace within which values for this store are
   *   cached. - extension: An optional file-extension for paths. - ttl: The default time-to-live
   *   for cached values in seconds. Default: 0 (never expires) - hash: The hashing algorithm to use
   *   when generating cache keys. Default: "sha1"
   */
  constructor(options: FileSystemCacheOptions = {}) {
    this.basePath = formatPath(options.basePath);
    this.hash = options.hash ?? 'sha1';
    this.ns = hash(this.hash, options.ns);
    this.ttl = options.ttl ?? 0;

    if (isString(options.extension)) {
      this.extension = options.extension;
    }

    if (isFileSync(this.basePath)) {
      throw new Error(`The basePath '${this.basePath}' is a file. It should be a folder.`);
    }

    if (!hashExists(this.hash)) {
      throw new Error(`Hash does not exist: ${this.hash}`);
    }
  }

  /**
   * Generates the path to the cached files.
   *
   * @param {string} key: The key of the cache item.
   */
  public path(key: string): string {
    if (isNothing(key)) {
      throw new Error(`Path requires a cache key.`);
    }
    let name = hash(this.hash, key);

    if (this.ns) {
      name = `${this.ns}-${name}`;
    }

    if (this.extension) {
      name = `${name}.${this.extension.replace(/^\./, '')}`;
    }
    return `${this.basePath}/${name}`;
  }

  /**
   * Determines whether the file exists.
   *
   * @param {string} key: The key of the cache item.
   */
  public fileExists(key: string) {
    return pathExists(this.path(key));
  }

  /** Ensure that the base path exists. */
  public async ensureBasePath() {
    if (!this.basePathExists) {
      await ensureDir(this.basePath);
    }
    this.basePathExists = true;
  }

  /**
   * Gets the contents of the file with the given key.
   *
   * @param {string} key: The key of the cache item.
   * @param defaultValue: Optional. A default value to return if the value does not exist in cache.
   * @returns File contents, or undefined if the file does not exis
   */
  public get(key: string, defaultValue?: any) {
    return getValueP(this.path(key), defaultValue);
  }

  /**
   * Gets the contents of the file with the given key.
   *
   * @param {string} key: The key of the cache item.
   * @param defaultValue: Optional. A default value to return if the value does not exist in cache.
   * @returns The cached value, or undefined.
   */
  public getSync(key: string, defaultValue?: any) {
    const path = this.path(key);
    const content = readFileSync(path) || '';
    return fs.existsSync(path) ? toGetValue(JSON.parse(content)) : defaultValue;
  }

  /**
   * Writes the given value to the file-system.
   *
   * @param {string} key: The key of the cache item.
   * @param value: The value to write (Primitive or Object).
   */
  public async set(key: string, value: any, ttl?: number) {
    const path = this.path(key);
    ttl = typeof ttl === 'number' ? ttl : this.ttl;
    await this.ensureBasePath();
    await fsp.writeFile(path, toJson(value, ttl));
    return { path };
  }

  /**
   * Writes the given value to the file-system and memory cache.
   *
   * @param {string} key: The key of the cache item.
   * @param value: The value to write (Primitive or Object).
   * @returns The cache.
   */
  public setSync(key: string, value: any, ttl?: number) {
    ttl = typeof ttl === 'number' ? ttl : this.ttl;
    fs.writeFileSync(this.path(key), toJson(value, ttl));
    return this;
  }

  /**
   * Removes the item from the file-system.
   *
   * @param {string} key: The key of the cache item.
   */
  public remove(key: string) {
    return remove(this.path(key));
  }

  /** Removes all items from the cache. */
  public async clear() {
    const paths = await filePathsP(this.basePath, this.ns);
    await Promise.all(paths.map((path) => remove(path)));
    console.groupEnd();
  }

  /**
   * Saves several items to the cache in one operation.
   *
   * @param {array} items: An array of objects of the form { key, value }.
   */
  public async save(
    input: ({ key: string; value: any } | null | undefined)[]
  ): Promise<{ paths: string[] }> {
    type Item = { key: string; value: any };
    let items = (Array.isArray(input) ? input : [input]) as Item[];

    const isValid = (item: any) => {
      if (!R.is(Object, item)) {
        return false;
      }
      return item.key && item.value;
    };

    items = items.filter((item) => Boolean(item));
    items
      .filter((item) => !isValid(item))
      .forEach(() => {
        const err = `Save items not valid, must be an array of {key, value} objects.`;
        throw new Error(err);
      });

    if (items.length === 0) {
      return { paths: [] };
    }

    const paths = await Promise.all(
      items.map(async (item) => (await this.set(item.key, item.value)).path)
    );

    return { paths };
  }

  /** Loads all files within the cache's namespace. */
  public async load(): Promise<{ files: { path: string; value: any }[] }> {
    const paths = await filePathsP(this.basePath, this.ns);

    if (paths.length === 0) {
      return { files: [] };
    }
    const files = await Promise.all(
      paths.map(async (path) => ({ path, value: await getValueP(path) }))
    );
    return { files };
  }
}

/** Helpers */

function formatPath(path?: string) {
  path = ensureString('./.cache', path);
  path = toAbsolutePath(path);
  return path;
}

export function createFileSystemCache(options: FileSystemCacheOptions): FileSystemCache {
  return new FileSystemCache(options);
}
