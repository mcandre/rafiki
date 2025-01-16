const
    EntryPattern = /^([0-9]+)?\s*(.+)$/,
    LorcanaApiFetchUrl = 'https://api.lorcana-api.com/cards/fetch',
    Chunk = 19,
    indexList = $('#index_list');

function resetIndexList() {
    indexList.empty();
    indexList.append('<div class="index_placeholder"></div>');
}

$('#generate').on('click', function() {
    const
        names = [],
        cardsByName = {},
        requests = [],
        lines = $('#deck_list').val().split('\n'),
        errors = $('#errors'),
        generate = $('#generate'),
        generateSpinner = $('#generate_spinner');
    resetIndexList();
    errors.empty();
    generate.prop('disabled', !generate.prop('disabled'));
    generateSpinner.toggle();

    for (const line of lines) {
        if (line === '') {
            continue;
        }

        const m = EntryPattern.exec(line);

        if (m === null) {
            errors.append(`<p>invalid entry: ${line}</p>`);
            generateSpinner.toggle();
            generate.prop('disabled', !generate.prop('disabled'));
            break;
        }

        let [_m, _count, name] = m;
        names.push(name);
    }

    let u = new URL(LorcanaApiFetchUrl);
    u.searchParams.append(
        'search',
        names.map(e => `name=${e}`).join(';|')
    );
    $.get(u, function(data, status) {
        if (status < 200 || status > 299) {
            console.log(`u: ${u}`);
            errors.append(`<p>lorcana api responded status: ${status}</p>`);
            generateSpinner.toggle();
            generate.prop('disabled', !generate.prop('disabled'));
            return;
        }

        if (data.length === 0) {
            console.log(`u: ${u}`);
            errors.append(`<p>no lorcana cards match</p>`);
            generateSpinner.toggle();
            generate.prop('disabled', !generate.prop('disabled'));
            return;
        }

        console.log(`data: ${JSON.stringify(data)}`);

        for (const d of data) {
            cardsByName[d.Name] = {
                inkable: d.Inkable,
                color: d.Color.toLowerCase(),
                cost: d.Cost,
                name: d.Name,
            };
        };

        const
            cardsSorted = {},
            entries = Object.entries(cardsByName);
        entries.sort((a, b) => a[0].localeCompare(b[0]));

        for (const [k, v] of entries) {
            cardsSorted[k] = v;
        }

        let indices = Object.values(cardsSorted);
        indices = [...Array(Math.ceil(indices.length/Chunk))].map(_ => indices.splice(0, Chunk));
        indexList.empty();

        for (const index of indices) {
            let indexDiv = '<div class="index">';

            for (const card of index) {
                let cardDiv = '<div class="tcg_card">';

                cardDiv += `<img class="color" src="symbols/${card.color}.png" width="14" height="16" alt="${card.color}">`;
                cardDiv += '<span class="cost ';

                if (!card.inkable) {
                    cardDiv += 'un';
                }

                cardDiv += `inkable">${card.cost}</span>`;
                cardDiv += `<span class="name">${card.name}</span>`;
                cardDiv += '</div>';
                indexDiv += cardDiv;
            }

            indexDiv += '</div>';
            indexList.append(indexDiv);
        }

        generateSpinner.toggle();
        generate.prop('disabled', !generate.prop('disabled'));
    }).catch(e => {
        errors.append(`error: ${e}`);
        generateSpinner.toggle();
        generate.prop('disabled', !generate.prop('disabled'));
    });
});
