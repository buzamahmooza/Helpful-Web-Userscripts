
url1 = new URL(href1);
url2 = new URL(href2);
sp1 = url1.searchParams;
sp2 = url2.searchParams;

console.log(
    Object.fromEntries(sp1),
    '\n',
    Object.fromEntries(sp2)
);

console.log(
    JSON.stringify(sp1, null, 4),
    JSON.stringify(sp2, null, 4)
);

