import React, {Component} from 'react';
import Layout from "../../../../components/Layout";
import {graphql} from "../../../../utils/graphql";
import {gql} from "@apollo/client";
import GuildContainer from "../../../../components/GuildContainer";
import {
    Button,
    Card,
    CardHeader, CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    Grid,
    Switch,
    Typography
} from "@material-ui/core";
import {Info, QuestionAnswer} from "@material-ui/icons";

const categories = [
    {
        name: '기본',
        items: [
            {
                name: '도움말',
                code: 'help',
                icon: QuestionAnswer
            }
        ]
    },
    {
        name: '정보',
        items: [
            {
                name: '서버 정보',
                code: 'guild_info',
                icon: Info
            }
        ]
    }
]

class Toggle extends Component<any> {
    state: {
        guild: any
        disables:string[],
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
                        데이터 처리중입니다. 잠시만 기다려주세요..
                    </DialogContent>
                    <DialogActions>
                        <Button disabled>
                            <CircularProgress/>
                        </Button>
                    </DialogActions>
                </Dialog>
                <GuildContainer guild={guild}>
                    {
                        categories.map((category, i) => (
                            <div key={i}>
                                <Typography variant="h5">
                                    {category.name}
                                    <Grid container spacing={2}>
                                        {
                                            category.items.map((item,idx) => (
                                                <Grid item xs={12} md={4} key={idx}>
                                                    <Card variant="outlined">
                                                        <CardHeader title={item.name} avatar={<item.icon/>} action={
                                                            <Switch checked={!this.state.disables.includes(item.code)} onChange={async (event, checked) => {
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
                                                                    this.setState({disables: data.guild.enable, loading: false})
                                                                } else {
                                                                    const data = await graphql(gql`
                                                                        query {
                                                                            guild(id: "${this.props.match.params.id.replace('"', '\\"')}") {
                                                                                disable(command: ${item.code})
                                                                            }
                                                                        }
                                                                    `)
                                                                    this.setState({disables: data.guild.disable, loading: false})
                                                                }
                                                            }}/>
                                                        }/>
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