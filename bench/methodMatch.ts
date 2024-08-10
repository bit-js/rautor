import { group, bench, run } from 'mitata';

for (let i = 0; i < 10; i++) bench('noop', () => { });

const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

const methodMap = {}, idMap = {};
methods.forEach((method, idx) => {
  methodMap[method] = () => idx;
  idMap[method] = idx;
});

const data = new Array(10000).fill(0).map(() => methods[Math.round(Math.random() * (methods.length - 1))]);
console.log(data);

const linearCheck = (val: string) => {
  if (val === 'GET') return 0;
  else if (val === 'POST') return 1;
  else if (val === 'PUT') return 2;
  else if (val === 'PATCH') return 3;
  else if (val === 'DELETE') return 4;
}

const mapCheck = (val: string) => methodMap[val]();

const idCheck = (val: string) => {
  switch (idMap[val]) {
    case 0: return 0;
    case 1: return 1;
    case 2: return 2;
    case 3: return 3;
    case 4: return 4;
  }
}

const switchCheck = (val: string) => {
  switch (val) {
    case 'GET': return 0;
    case 'POST': return 1;
    case 'PUT': return 2;
    case 'PATCH': return 3;
    case 'DELETE': return 4;
  }
}

group('Static checking', () => {
  bench('Linear checking', () => data.map(linearCheck));
  bench('Map checking', () => data.map(mapCheck));
  bench('ID checking', () => data.map(idCheck));
  bench('Switch checking', () => data.map(switchCheck));
});

run();
