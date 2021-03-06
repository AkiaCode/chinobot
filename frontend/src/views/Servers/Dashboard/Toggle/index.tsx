import React, {Component} from 'react';
import Layout from "../../../../components/Layout";
import {graphql} from "../../../../utils/graphql";
import {gql} from "@apollo/client";
import GuildContainer from "../../../../components/GuildContainer";
import {
    Card,
    Dialog,
    DialogActions,
    DialogContent,
    Grid, List, ListItem, ListItemIcon, ListItemSecondaryAction, ListItemText,
    Switch,
    Typography
} from "@material-ui/core";
import categories from './items'

class Toggle extends Component<any> {
    state: {
        guild: any
        disables: string[],
        loading: boolean
    } = {
        guild: null,
        disables: [],
        loading: true
    }

    async componentDidMount() {
        const data = await graphql(gql`
            query {
                guild(id: "${this.props.match.params.id.replace('"', '\\"')}") {
                    icon
                    id
                    name
                    disabled
                }
            }
        `)
        if (data.guild) {
            this.setState({
                guild: data.guild,
                disables: data.guild.disabled,
                loading: false
            })
        } else {
            this.setState({
                guild: false,
                loading: false
            })
        }
    }

    render() {
        const {guild} = this.state

        return (
            <Layout>
                <Dialog open={this.state.loading}>
                    <DialogContent>
                        데이터 처리중입니다...
                    </DialogContent>
                    <DialogActions/>
                </Dialog>
                <GuildContainer guild={guild}>
                    {
                        categories.map((category, i) => (
                            <div key={i}>
                                <Typography variant="h5">
                                    {category.name} <Switch
                                    checked={category.items.filter(r => !this.state.disables.includes(r.code)).length === category.items.length}
                                    onChange={async (event, checked) => {
                                        if (checked) {
                                            this.setState({
                                                loading: true
                                            })
                                            await Promise.all(category.items.map(i => (
                                                graphql(gql`
                                                    query {
                                                        guild(id: "${this.props.match.params.id.replace('"', '\\"')}") {
                                                            enable(command: ${i.code})
                                                        }
                                                    }
                                                `)
                                            )))
                                            const data = await graphql(gql`
                                                query {
                                                    guild(id: "${this.props.match.params.id.replace('"', '\\"')}") {
                                                        disabled
                                                    }
                                                }
                                            `)
                                            this.setState({
                                                disables: data.guild.disabled,
                                                loading: false
                                            })
                                        } else {
                                            this.setState({
                                                loading: true
                                            })
                                            await Promise.all(category.items.map(i => (
                                                graphql(gql`
                                                    query {
                                                        guild(id: "${this.props.match.params.id.replace('"', '\\"')}") {
                                                            disable(command: ${i.code})
                                                        }
                                                    }
                                                `)
                                            )))
                                            const data = await graphql(gql`
                                                query {
                                                    guild(id: "${this.props.match.params.id.replace('"', '\\"')}") {
                                                        disabled
                                                    }
                                                }
                                            `)
                                            this.setState({
                                                disables: data.guild.disabled,
                                                loading: false
                                            })
                                        }
                                    }}/>
                                    <Grid container spacing={2}>
                                        {
                                            category.items.map((item, idx) => (
                                                <Grid item xs={12} md={4} key={idx}>
                                                    <Card variant="outlined">
                                                        <List>
                                                            <ListItem>
                                                                <ListItemIcon>
                                                                    {item.icon}
                                                                </ListItemIcon>
                                                                <ListItemText primary={item.name}/>
                                                                <ListItemSecondaryAction>
                                                                    <Switch
                                                                        checked={!this.state.disables.includes(item.code)}
                                                                        onChange={async () => {
                                                                            this.setState(
                                                                                {
                                                                                    loading: true
                                                                                }
                                                                            )
                                                                            if (this.state.disables.includes(item.code)) {
                                                                                const data = await graphql(gql`
                                                                        query {
                                                                            guild(id: "${this.props.match.params.id.replace('"', '\\"')}") {
                                                                                enable(command: ${item.code})
                                                                            }
                                                                        }
                                                                    `)
                                                                                this.setState({
                                                                                    disables: data.guild.enable,
                                                                                    loading: false
                                                                                })
                                                                            } else {
                                                                                const data = await graphql(gql`
                                                                        query {
                                                                            guild(id: "${this.props.match.params.id.replace('"', '\\"')}") {
                                                                                disable(command: ${item.code})
                                                                            }
                                                                        }
                                                                    `)
                                                                                this.setState({
                                                                                    disables: data.guild.disable,
                                                                                    loading: false
                                                                                })
                                                                            }
                                                                        }}/>
                                                                </ListItemSecondaryAction>
                                                            </ListItem>
                                                        </List>
                                                    </Card>
                                                </Grid>
                                            ))
                                        }
                                    </Grid>
                                </Typography>
                            </div>
                        ))
                    }
                </GuildContainer>
            </Layout>
        );
    }
}

export default Toggle;