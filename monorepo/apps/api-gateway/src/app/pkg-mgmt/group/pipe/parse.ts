import { isNotEmpty } from 'class-validator';

enum Group {
  name,
  avatar,
  channel,
  billing,
  funding,
  todos,
  task,
  packages,
  members,
  deleted,
  createdAt,
  updatedAt,
  deletedAt,
}

export class SorterParser {
  parse(sortProp?: string): Record<string, 1 | -1> {
    const sortableParameters = {};
    const props = sortProp !== undefined ? sortProp.split(';') : [];
    props
      .filter((v) => isNotEmpty(v))
      .forEach((name: string) => {
        const desc = name[0] === '-' ? true : false;
        const prop = desc ? name.slice(1) : name;

        sortableParameters[prop] = desc ? -1 : 1;
      });

    if (Object.keys(sortableParameters).length === 0) {
      sortableParameters['createdAt'] = 1;
    }
    return sortableParameters;
  }
}

export class ProjectionParser {
  parse(projProp?: string): Record<string, unknown> {
    const projectionParameters = {};
    const props = projProp !== undefined ? projProp.split(';') : [];
    props
      .filter((v) => isNotEmpty(v))
      .forEach((name: string) => {
        projectionParameters[name.trim()] = true;
      });

    if (Object.keys(projectionParameters).length === 0) {
      return this.defaultProjection();
    }

    return projectionParameters;
  }
  private defaultProjection(): Record<string, unknown> {
    const projectionParameters = {};
    const gr = Object.keys(Group).filter((v) => isNaN(Number(v)));
    gr.forEach((element) => {
      projectionParameters[element] = true;
    });
    return projectionParameters;
  }
}
