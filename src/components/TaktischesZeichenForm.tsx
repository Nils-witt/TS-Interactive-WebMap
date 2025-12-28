import TaktischesZeichen from "taktische-zeichen-react";
import {
    einheiten,
    type EinheitId,
    type FachaufgabeId,
    fachaufgaben,
    grundzeichen,
    type GrundzeichenId,
    organisationen,
    type OrganisationId,
    type TaktischesZeichen as TaktischesZeichenType
} from "taktische-zeichen-core";
import React from "react";


export function TaktischesZeichenForm() {
    const [symbol, setSymbol] = React.useState<TaktischesZeichenType>({
        grundzeichen: 'kraftfahrzeug-landgebunden',
        organisation: undefined,
        einheit: undefined,
        fachaufgabe: undefined
    });

    return (<div>
            <h2>Taktisches Zeichen</h2>
            <TaktischesZeichen einheit={symbol.einheit} grundzeichen={symbol.grundzeichen}
                               organisation={symbol.organisation} fachaufgabe={symbol.fachaufgabe} height={50}/>
            <table>
                <tbody>
                <tr>
                    <td>
                        <label>Grundzeichen</label>
                    </td>
                    <td>
                        <select
                            value={symbol.grundzeichen}
                            onChange={(e) => setSymbol({
                                ...symbol,
                                grundzeichen: e.target.value as GrundzeichenId
                            })}>
                            {grundzeichen.map((gz) => (
                                <option key={gz.id} value={gz.id}>{gz.label}</option>
                            ))}
                        </select>
                    </td>
                </tr>
                <tr>
                    <td>
                        <label>Organisation</label>
                    </td>
                    <td>
                        <select
                            value={symbol.organisation}
                            onChange={(e) => setSymbol({
                                ...symbol,
                                organisation: e.target.value as OrganisationId
                            })}>
                            {organisationen.map((org) => (
                                <option key={org.id} value={org.id}>{org.label}</option>
                            ))}
                        </select>
                    </td>
                </tr>
                <tr>
                    <td>
                        <label>Einheit</label>
                    </td>
                    <td>
                        <select value={symbol.einheit}
                                onChange={(e) => setSymbol({...symbol, einheit: e.target.value as EinheitId})}>
                            <option value="">Keine</option>
                            {einheiten.map((einheit) => (
                                <option key={einheit.id} value={einheit.id}>{einheit.label}</option>
                            ))}
                        </select>
                    </td>
                </tr>
                <tr>
                    <td>
                        <label>Fachaufgabe</label>
                    </td>
                    <td>
                        <select
                            value={symbol.fachaufgabe}
                            onChange={(e) => setSymbol({...symbol, fachaufgabe: e.target.value as FachaufgabeId})}>
                            <option value="">None</option>
                            {fachaufgaben.map((fa) => (
                                <option key={fa.id} value={fa.id}>{fa.label}</option>
                            ))}
                        </select>
                    </td>
                </tr>
                </tbody>
            </table>
        </div>
    )
}